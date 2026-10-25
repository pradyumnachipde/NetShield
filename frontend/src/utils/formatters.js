
export function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

export function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatConfidence(value) {
  return `${(Number(value || 0) * 100).toFixed(2)}%`;
}

export function getApiError(error) {
  const data = error.response?.data;

  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;
  if (Array.isArray(data?.file)) return data.file.join(" ");

  return error.message || "Something went wrong.";
}
