export const getErrorMessage = (data: any) => {
  return (
    data.message ||
    Object.values(data.errors || {})
      .flat()
      .join(", ") ||
    "Something went wrong."
  );
};
