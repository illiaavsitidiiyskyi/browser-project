import { BrowserWindow, Session, dialog } from 'electron';

export function setupCertificateVerification(
  targetSession: Session,
  parentWindow: BrowserWindow
) {
  targetSession.setCertificateVerifyProc((request, callback) => {
    const { hostname, errorCode, verificationResult } = request;

    if (errorCode === 0) {
      callback(-3);
      return;
    }

    dialog.showMessageBox(parentWindow, {
      type: 'warning',
      title: 'Небезопасное соединение',
      message: `Сайт ${hostname} использует недействительный сертификат`,
      detail: `Причина: ${verificationResult}. Соединение заблокировано.`,
      buttons: ['Понятно']
    });

    callback(-2);
  });
}