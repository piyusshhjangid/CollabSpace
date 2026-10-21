const API_BASE_URL = "http://localhost:5000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const accessToken = localStorage.getItem("accessToken");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",

      ...(accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {}),

      ...options.headers,
    },
  });

  let data: {
    success?: boolean;
    message?: string;
    data?: T;
  };

  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      "The server returned an invalid response",
      response.status,
    );
  }

  if (!response.ok) {
    if (response.status === 403) {
  window.dispatchEvent(
    new CustomEvent("collabspace:forbidden", {
      detail: {
        message:
          data.message ??
          "You don't have permission to perform this action.",
      },
    }),
  );

  throw new ApiError(
    data.message ??
      "You don't have permission to perform this action.",
    403,
  );
}
    throw new ApiError(
      data.message || "Request failed",
      response.status,
    );
  }

  return data as T;
}
