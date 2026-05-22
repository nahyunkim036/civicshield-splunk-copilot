export function getStatusTone(status) {
  if (status === "failed") return "danger";
  if (status === "warning") return "warning";
  if (status === "success") return "success";
  if (status === "blocked") return "resolved";
  return "neutral";
}

export function getRiskTone(riskLevel) {
  if (riskLevel === "High") return "danger";
  if (riskLevel === "Medium") return "warning";
  if (riskLevel === "Low") return "success";
  return "neutral";
}

export function getPatternExplanation(pattern) {
  const explanations = {
    "Repeated failed logins from the same IP":
      "Multiple failed login attempts came from the same source IP.",
    "Successful login after repeated failures":
      "The suspicious IP later completed a successful login.",
    "Sensitive file access detected":
      "A private student records file was accessed.",
    "Permission change detected after suspicious activity":
      "File permissions were changed after the suspicious sequence.",
    "Account lock triggered after repeated failures":
      "The system locked the account after repeated failed login attempts.",
    "Source IP blocked by security policy":
      "The suspicious source IP was blocked before successful compromise.",
  };

  return explanations[pattern] || "This pattern was detected from the Splunk logs.";
}