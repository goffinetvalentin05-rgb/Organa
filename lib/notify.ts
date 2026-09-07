import toast from "react-hot-toast";

export function notifySuccess(message: string, id?: string) {
  return toast.success(message, id ? { id } : undefined);
}

export function notifyError(message: string, id?: string) {
  return toast.error(message, id ? { id } : undefined);
}

export function notifyInfo(message: string, id?: string) {
  return toast(message, {
    className: "obillz-toast-info",
    ...(id ? { id } : {}),
  });
}

export function notifyWarning(message: string, id?: string) {
  return toast(message, {
    className: "obillz-toast-warning",
    ...(id ? { id } : {}),
  });
}

