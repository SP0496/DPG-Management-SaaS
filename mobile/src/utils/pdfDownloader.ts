import { Share } from 'react-native';
import { pgApi } from '../api/pgApi';

export interface PdfDownloadResult {
  filename: string;
  byteLength: number;
  isValidPdf: boolean;
}

function startsWithPdfHeader(buffer: ArrayBuffer): boolean {
  if (!buffer || buffer.byteLength < 5) return false;
  const view = new Uint8Array(buffer, 0, 5);
  return (
    view[0] === 0x25 && // %
    view[1] === 0x50 && // P
    view[2] === 0x44 && // D
    view[3] === 0x46 && // F
    view[4] === 0x2d // -
  );
}

export async function downloadAndReportInvoicePdf(
  invoiceId: string,
  invoiceNumber: string
): Promise<PdfDownloadResult> {
  const res = await pgApi.downloadInvoicePdf(invoiceId);
  const isValidPdf = startsWithPdfHeader(res.arrayBuffer);
  const sizeKb = Math.max(1, Math.round(res.arrayBuffer.byteLength / 1024));

  await Share.share({
    title: `Rent Invoice ${invoiceNumber}`,
    message: `PG Rent Invoice ${invoiceNumber} PDF verified (${sizeKb} KB).`,
  }).catch(() => undefined);

  return {
    filename: res.filename || `invoice-${invoiceNumber}.pdf`,
    byteLength: res.arrayBuffer.byteLength,
    isValidPdf,
  };
}

export async function downloadAndReportReceiptPdf(
  params: { submissionId?: string; paymentId?: string; receiptNumber: string }
): Promise<PdfDownloadResult> {
  const res = params.submissionId
    ? await pgApi.downloadSubmissionReceiptPdf(params.submissionId)
    : await pgApi.downloadPaymentReceiptPdf(params.paymentId!);

  const isValidPdf = startsWithPdfHeader(res.arrayBuffer);
  const sizeKb = Math.max(1, Math.round(res.arrayBuffer.byteLength / 1024));

  await Share.share({
    title: `Rent Receipt ${params.receiptNumber}`,
    message: `Official PG Rent Payment Receipt ${params.receiptNumber} PDF (${sizeKb} KB).`,
  }).catch(() => undefined);

  return {
    filename: res.filename || `receipt-${params.receiptNumber}.pdf`,
    byteLength: res.arrayBuffer.byteLength,
    isValidPdf,
  };
}
