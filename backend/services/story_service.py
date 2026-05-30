from collections import defaultdict


def _extract_time(timestamp):
    """
    timestamp example:
    "2026-06-02 09:00:01"

    return:
    "09:00:01"
    """
    if not timestamp:
        return "unknown"

    parts = timestamp.split(" ")
    if len(parts) >= 2:
        return parts[1]

    return timestamp


def _group_events_by_type(events):
    grouped = defaultdict(list)

    for event in events:
        event_type = event.get("event_type", "unknown")
        grouped[event_type].append(event)

    return grouped


def _get_primary_source_ip(events):
    for event in events:
        if event.get("src_ip"):
            return event.get("src_ip")

    return "unknown"


def _get_primary_user(events):
    for event in events:
        if event.get("user"):
            return event.get("user")

    return "unknown"


def _build_timeline(events):
    """
    Converts raw parsed Splunk events into human-readable incident stages.

    This is not just displaying logs.
    This is the event-to-story transformation layer.
    """
    grouped = _group_events_by_type(events)
    timeline = []

    failed_logins = [
        event for event in events
        if event.get("event_type") == "login"
        and event.get("status") == "failed"
    ]

    successful_logins = [
        event for event in events
        if event.get("event_type") == "login"
        and event.get("status") == "success"
    ]

    account_locks = grouped.get("account_lock", [])
    ip_blocks = grouped.get("ip_block", [])
    file_accesses = grouped.get("file_access", [])
    permission_changes = grouped.get("permission_change", [])

    primary_ip = _get_primary_source_ip(events)
    primary_user = _get_primary_user(events)

    step = 1

    if failed_logins:
        first_failed = failed_logins[0]
        last_failed = failed_logins[-1]

        timeline.append({
            "step": step,
            "time": _extract_time(first_failed.get("timestamp")),
            "stage": "Initial Access Attempt",
            "event_type": "login",
            "severity": "medium",
            "headline": "External login attempts started",
            "narration": (
                f"An external source IP began attempting to log in as "
                f"{primary_user}."
            ),
            "evidence_hint": (
                f"{len(failed_logins)} failed login attempts were observed "
                f"from {primary_ip}."
            ),
        })
        step += 1

        if len(failed_logins) >= 3:
            timeline.append({
                "step": step,
                "time": _extract_time(last_failed.get("timestamp")),
                "stage": "Attack Pattern Detected",
                "event_type": "login",
                "severity": "warning",
                "headline": "Repeated failures suggest brute force",
                "narration": (
                    f"The same source IP produced repeated failed login attempts. "
                    f"This pattern is consistent with credential guessing or "
                    f"a brute-force attempt."
                ),
                "evidence_hint": (
                    f"{len(failed_logins)} failed attempts came from {primary_ip}."
                ),
            })
            step += 1

    if successful_logins:
        success = successful_logins[0]

        timeline.append({
            "step": step,
            "time": _extract_time(success.get("timestamp")),
            "stage": "Possible Account Compromise",
            "event_type": "login",
            "severity": "high",
            "headline": "Login succeeded after failures",
            "narration": (
                "A successful login occurred after repeated failures. "
                "This may indicate that the attacker guessed valid credentials."
            ),
            "evidence_hint": (
                f"Successful login from {success.get('src_ip', primary_ip)}."
            ),
        })
        step += 1

    if account_locks:
        account_lock = account_locks[0]

        timeline.append({
            "step": step,
            "time": _extract_time(account_lock.get("timestamp")),
            "stage": "Containment Triggered",
            "event_type": "account_lock",
            "severity": "resolved",
            "headline": "Account lock policy activated",
            "narration": (
                "The system locked the account after repeated failures, "
                "helping prevent additional login attempts."
            ),
            "evidence_hint": account_lock.get(
                "description",
                "Account lock event was detected."
            ),
        })
        step += 1

    if ip_blocks:
        ip_block = ip_blocks[0]

        timeline.append({
            "step": step,
            "time": _extract_time(ip_block.get("timestamp")),
            "stage": "Source Blocked",
            "event_type": "ip_block",
            "severity": "resolved",
            "headline": "Suspicious IP was blocked",
            "narration": (
                "The firewall blocked the suspicious source IP, reducing the "
                "chance of continued attacks from the same origin."
            ),
            "evidence_hint": ip_block.get(
                "description",
                "Source IP block event was detected."
            ),
        })
        step += 1

    if file_accesses:
        file_access = file_accesses[0]

        timeline.append({
            "step": step,
            "time": _extract_time(file_access.get("timestamp")),
            "stage": "Sensitive Resource Access",
            "event_type": "file_access",
            "severity": "high",
            "headline": "Sensitive file was accessed",
            "narration": (
                "A sensitive resource was accessed after suspicious login activity. "
                "This may indicate exposure risk."
            ),
            "evidence_hint": file_access.get(
                "description",
                "Sensitive file access was detected."
            ),
        })
        step += 1

    if permission_changes:
        permission_change = permission_changes[0]

        timeline.append({
            "step": step,
            "time": _extract_time(permission_change.get("timestamp")),
            "stage": "Permission Change",
            "event_type": "permission_change",
            "severity": "high",
            "headline": "File permissions changed",
            "narration": (
                "Permissions were changed after suspicious activity. "
                "This could indicate an attempt to maintain or expand access."
            ),
            "evidence_hint": permission_change.get(
                "description",
                "Permission change was detected."
            ),
        })
        step += 1

    return timeline


def _build_what_if_scenarios(events, timeline):
    grouped = _group_events_by_type(events)

    has_account_lock = bool(grouped.get("account_lock"))
    has_ip_block = bool(grouped.get("ip_block"))
    has_successful_login = any(
        event.get("event_type") == "login" and event.get("status") == "success"
        for event in events
    )

    scenarios = []

    if has_account_lock:
        scenarios.append({
            "id": "no_account_lock",
            "question": "What if the account was not locked?",
            "likely_outcome": (
                "The attacker could continue guessing passwords for the admin "
                "account, increasing the chance of a successful login."
            ),
            "potential_impact": (
                "A compromised admin account could expose student records or "
                "allow unauthorized configuration changes."
            ),
            "recommended_control": (
                "Keep account lockout enabled and consider lowering the lockout "
                "threshold for privileged accounts."
            ),
        })
    else:
        scenarios.append({
            "id": "add_account_lock",
            "question": "What if account lockout was enabled?",
            "likely_outcome": (
                "Repeated failed attempts would be interrupted earlier."
            ),
            "potential_impact": (
                "This would reduce the risk of brute-force success."
            ),
            "recommended_control": (
                "Enable lockout rules for admin and privileged accounts."
            ),
        })

    if has_ip_block:
        scenarios.append({
            "id": "no_ip_block",
            "question": "What if the IP was not blocked?",
            "likely_outcome": (
                "The same source could continue sending login attempts or probe "
                "other services."
            ),
            "potential_impact": (
                "Repeated traffic from the same source could increase noise and "
                "risk across the environment."
            ),
            "recommended_control": (
                "Keep source blocking enabled and review whether additional rate "
                "limiting is needed."
            ),
        })

    if not has_successful_login:
        scenarios.append({
            "id": "login_succeeded",
            "question": "What if the login succeeded?",
            "likely_outcome": (
                "The event would shift from a contained brute-force attempt to a "
                "possible account compromise."
            ),
            "potential_impact": (
                "The attacker could access internal systems using valid admin "
                "credentials."
            ),
            "recommended_control": (
                "Require MFA for admin users and review all privileged activity."
            ),
        })

    scenarios.append({
        "id": "mfa_enabled",
        "question": "What if MFA was enabled?",
        "likely_outcome": (
            "Even if the password was guessed, the attacker would still need a "
            "second authentication factor."
        ),
        "potential_impact": (
            "MFA would greatly reduce the chance of account takeover."
        ),
        "recommended_control": (
            "Enable MFA for administrator and high-risk accounts."
        ),
    })

    return scenarios


def _build_response_coach(events, timeline):
    grouped = _group_events_by_type(events)

    has_account_lock = bool(grouped.get("account_lock"))
    has_ip_block = bool(grouped.get("ip_block"))
    has_file_access = bool(grouped.get("file_access"))
    has_permission_change = bool(grouped.get("permission_change"))

    response_steps = []

    response_steps.append({
        "priority": 1,
        "action": "Review the targeted account.",
        "why": (
            "The incident involved repeated login attempts against a specific user. "
            "Confirm whether this account is still secure."
        ),
        "owner": "IT admin",
    })

    if has_account_lock:
        response_steps.append({
            "priority": 2,
            "action": "Keep the account locked until review is complete.",
            "why": (
                "Keeping the lock in place prevents additional attempts while the "
                "activity is investigated."
            ),
            "owner": "IT admin",
        })
    else:
        response_steps.append({
            "priority": 2,
            "action": "Enable account lockout rules.",
            "why": (
                "Account lockout helps stop repeated credential guessing."
            ),
            "owner": "Security owner",
        })

    if has_ip_block:
        response_steps.append({
            "priority": 3,
            "action": "Verify the firewall block.",
            "why": (
                "The source IP was blocked, but the block should be confirmed and "
                "monitored for repeated attempts."
            ),
            "owner": "Network admin",
        })
    else:
        response_steps.append({
            "priority": 3,
            "action": "Block or rate-limit the suspicious source IP.",
            "why": (
                "Blocking repeated suspicious traffic reduces exposure."
            ),
            "owner": "Network admin",
        })

    if has_file_access or has_permission_change:
        response_steps.append({
            "priority": 4,
            "action": "Audit sensitive resource activity.",
            "why": (
                "Sensitive files or permission changes were observed after suspicious "
                "activity."
            ),
            "owner": "Data owner",
        })
    else:
        response_steps.append({
            "priority": 4,
            "action": "Confirm that no sensitive resources were accessed.",
            "why": (
                "This helps verify that the incident was contained before data exposure."
            ),
            "owner": "IT admin",
        })

    response_steps.append({
        "priority": 5,
        "action": "Enable MFA for privileged accounts.",
        "why": (
            "MFA reduces the risk of account takeover even if credentials are guessed."
        ),
        "owner": "Security owner",
    })

    return response_steps


def _build_story_summary(events, timeline):
    grouped = _group_events_by_type(events)
    primary_ip = _get_primary_source_ip(events)
    primary_user = _get_primary_user(events)

    has_account_lock = bool(grouped.get("account_lock"))
    has_ip_block = bool(grouped.get("ip_block"))
    has_file_access = bool(grouped.get("file_access"))
    has_permission_change = bool(grouped.get("permission_change"))

    failed_count = len([
        event for event in events
        if event.get("event_type") == "login"
        and event.get("status") == "failed"
    ])

    if has_account_lock and has_ip_block and not has_file_access:
        story_title = "Blocked Brute Force Attempt"
        outcome = "Contained"
        plain_summary = (
            f"An external IP repeatedly attempted to access the {primary_user} "
            f"account. The system locked the account and blocked the source before "
            f"any sensitive access was observed."
        )
    elif has_file_access or has_permission_change:
        story_title = "Possible Account Compromise with Sensitive Access"
        outcome = "Needs Investigation"
        plain_summary = (
            f"Suspicious login activity from {primary_ip} was followed by sensitive "
            f"resource activity. This may indicate account compromise or data exposure."
        )
    elif failed_count >= 3:
        story_title = "Suspicious Login Burst"
        outcome = "Review Needed"
        plain_summary = (
            f"{failed_count} failed login attempts were observed from {primary_ip}. "
            f"The pattern suggests credential guessing and should be reviewed."
        )
    else:
        story_title = "Security Activity Review"
        outcome = "Low Risk"
        plain_summary = (
            "CivicShield reviewed the available Splunk events and found limited "
            "suspicious activity."
        )

    return {
        "story_title": story_title,
        "outcome": outcome,
        "plain_english_summary": plain_summary,
    }


def generate_incident_story(events):
    """
    Main public function used by the route.

    Input:
    - parsed Splunk events

    Output:
    - structured incident story
    - timeline
    - what-if scenarios
    - response coach
    """
    timeline = _build_timeline(events)
    summary = _build_story_summary(events, timeline)
    what_if_scenarios = _build_what_if_scenarios(events, timeline)
    response_coach = _build_response_coach(events, timeline)

    return {
        **summary,
        "story_mode": "incident_story_simulator",
        "timeline": timeline,
        "timeline_count": len(timeline),
        "what_if_scenarios": what_if_scenarios,
        "response_coach": response_coach,
    }