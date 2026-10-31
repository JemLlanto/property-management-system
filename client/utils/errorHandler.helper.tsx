// Shape of the error payloads the API returns: either a flat { message }
// or a field-keyed { errors: { field: string[] } }.
interface ErrorPayload {
  message?: string;
  errors?: Record<string, string[] | string>;
}

export const getErrorMessage = (data: ErrorPayload | null | undefined) => {
  if (!data) {
    return "Something went wrong.";
  }

  if (data.message) {
    return data.message;
  }

  const fieldMessages = Object.values(data.errors ?? {})
    .flat()
    .filter((message): message is string => typeof message === "string");

  return fieldMessages.join(", ") || "Something went wrong.";
};
