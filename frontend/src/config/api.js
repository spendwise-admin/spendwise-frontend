const getBaseUrl = () => {
  const hostname = window.location.hostname;

  // If running on localhost (laptop)
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:4000";
  }

  // If accessed from mobile or other device
  return `http://${hostname}:4000`;
};

export const API_BASE = getBaseUrl();