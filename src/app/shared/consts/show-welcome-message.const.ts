declare const swal: any;

export const showWelcomeMessage = (title: string) => {
  swal.fire({
    title: '<strong>ברוכים הבאים!</strong>',
    icon: 'info',
    html: title,
    showCloseButton: true,
    focusConfirm: false,
    confirmButtonText:
      '<i class="fa fa-thumbs-up"></i> צא לדרך!',
    confirmButtonAriaLabel: 'Thumbs up, great!',
    timer: 8000,
  });

}
