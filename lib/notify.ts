import toast from "react-hot-toast";

type ToastId = string | number;

export function notifySuccess(message: string, id?: ToastId) {
  return toast.success(message, id ? { id } : undefined);
}

export function notifyError(message: string, id?: ToastId) {
  return toast.error(message, id ? { id } : undefined);
}

export function notifyInfo(message: string, id?: ToastId) {
  return toast(message, id ? { id } : undefined);
}

