export class ToolError extends Error {
  readonly code: string;
  readonly httpStatus: number;

  constructor(message: string, code: string, httpStatus = 400) {
    super(message);
    this.name = "ToolError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export function isToolError(error: unknown): error is ToolError {
  return error instanceof ToolError;
}
