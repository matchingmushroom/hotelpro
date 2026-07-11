import Swal from 'sweetalert2';

export async function showConfirm({ title, text, confirmText = 'Yes', cancelText = 'Cancel', icon = 'warning' }) {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor: '#e94560',
    cancelButtonColor: '#64748b',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
  });
  return result.isConfirmed;
}

export async function showSuccess(title, text = '') {
  return Swal.fire({ title, text, icon: 'success', timer: 2000, showConfirmButton: false });
}

export async function showError(title, text = '') {
  return Swal.fire({ title, text, icon: 'error', confirmButtonColor: '#e94560' });
}

export async function showToast(icon, title) {
  return Swal.fire({ title, icon, timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' });
}
