package com.pgmanagement.saas.modules.payment.service;

import com.pgmanagement.saas.modules.invoice.dto.response.InvoiceItemResponse;
import com.pgmanagement.saas.modules.invoice.entity.RentInvoice;
import com.pgmanagement.saas.modules.payment.dto.response.PaymentReceiptResponse;
import com.pgmanagement.saas.shared.util.MoneyUtils;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Generates standard PDF 1.4 documents for rent invoices and verified payment receipts
 * without external binary dependencies.
 */
@Service
public class PdfDocumentService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DateTimeFormatter INSTANT_FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a z").withZone(ZoneId.of("Asia/Kolkata"));

    public byte[] generateInvoicePdf(
            RentInvoice invoice,
            List<InvoiceItemResponse> items,
            String ownerBusinessName,
            String ownerUpiId,
            String bankDetailsSummary,
            String propertyName,
            int floorNumber,
            String roomNumber,
            String bedCode,
            String residentName,
            String residentPhone) {

        List<PdfLine> lines = new ArrayList<>();
        lines.add(PdfLine.heading(safe(ownerBusinessName, "PG Management") + " - RENT INVOICE"));
        lines.add(PdfLine.sub("Invoice #: " + invoice.getInvoiceNumber()
                + "  |  Month: " + invoice.getBillingMonth().format(DateTimeFormatter.ofPattern("MMM yyyy"))
                + "  |  Due: " + invoice.getDueDate().format(DATE_FMT)
                + "  |  Status: " + invoice.getStatus().name()));
        lines.add(PdfLine.blank());

        lines.add(PdfLine.section("RESIDENT & ACCOMMODATION"));
        lines.add(PdfLine.text("Resident: " + safe(residentName, "-") + " (" + safe(residentPhone, "-") + ")"));
        lines.add(PdfLine.text("Property: " + safe(propertyName, "-")
                + "  |  Floor: " + floorNumber
                + "  |  Room: " + safe(roomNumber, "-")
                + "  |  Bed: " + safe(bedCode, "-")));
        lines.add(PdfLine.text("Billing Period: "
                + (invoice.getBillingPeriodStart() != null ? invoice.getBillingPeriodStart().format(DATE_FMT) : invoice.getBillingMonth().format(DATE_FMT))
                + " to "
                + (invoice.getBillingPeriodEnd() != null ? invoice.getBillingPeriodEnd().format(DATE_FMT)
                : invoice.getBillingMonth().withDayOfMonth(invoice.getBillingMonth().lengthOfMonth()).format(DATE_FMT))));
        lines.add(PdfLine.blank());

        lines.add(PdfLine.section("CHARGES BREAKDOWN"));
        if (items != null && !items.isEmpty()) {
            for (InvoiceItemResponse item : items) {
                lines.add(PdfLine.text("[" + item.getItemType().name() + "] " + item.getDescription()
                        + " : " + MoneyUtils.formatInrFromPaise(item.getAmountPaise())));
            }
        } else {
            lines.add(PdfLine.text("[BASE_RENT] Fixed Monthly Rent : INR " + invoice.getBaseRent().toPlainString()));
            if (invoice.getUtilityCharges().signum() > 0) {
                lines.add(PdfLine.text("[ADDITIONAL_CHARGE] Utility Charges : INR " + invoice.getUtilityCharges().toPlainString()));
            }
            if (invoice.getPenaltyFee().signum() > 0) {
                lines.add(PdfLine.text("[PENALTY] Late Fee : INR " + invoice.getPenaltyFee().toPlainString()));
            }
        }

        long totalPaise = invoice.getTotalAmountPaise() > 0
                ? invoice.getTotalAmountPaise()
                : MoneyUtils.toPaise(invoice.getTotalAmount());
        long paidPaise = invoice.getPaidAmountPaise() > 0
                ? invoice.getPaidAmountPaise()
                : MoneyUtils.toPaise(invoice.getPaidAmount());
        long balancePaise = Math.max(0L, totalPaise - paidPaise);

        lines.add(PdfLine.blank());
        lines.add(PdfLine.section("SUMMARY"));
        lines.add(PdfLine.sub("Total Billed: " + MoneyUtils.formatInrFromPaise(totalPaise)));
        lines.add(PdfLine.text("Verified Paid: " + MoneyUtils.formatInrFromPaise(paidPaise)));
        lines.add(PdfLine.sub("Outstanding Balance Due: " + MoneyUtils.formatInrFromPaise(balancePaise)));
        lines.add(PdfLine.blank());

        lines.add(PdfLine.section("DIRECT PAYMENT INSTRUCTIONS (NO PAYMENT GATEWAY)"));
        if (ownerUpiId != null && !ownerUpiId.isBlank()) {
            lines.add(PdfLine.text("Pay Direct via UPI ID: " + ownerUpiId.trim()));
        }
        if (bankDetailsSummary != null && !bankDetailsSummary.isBlank()) {
            lines.add(PdfLine.text("NEFT / IMPS Bank Transfer: " + bankDetailsSummary));
        }
        if (invoice.getNotes() != null && !invoice.getNotes().isBlank()) {
            lines.add(PdfLine.text("Notes: " + invoice.getNotes()));
        }

        return renderSimplePdf(lines);
    }

    public byte[] generateReceiptPdf(
            PaymentReceiptResponse receipt,
            int floorNumber,
            String billingMonthLabel,
            String remainingBalanceInr,
            String verificationSource) {

        List<PdfLine> lines = new ArrayList<>();
        lines.add(PdfLine.heading(safe(receipt.getOwnerBusinessName(), "PG Management") + " - OFFICIAL RENT RECEIPT"));
        lines.add(PdfLine.sub("Receipt #: " + receipt.getReceiptNumber()
                + "  |  Verified Status: CONFIRMED (" + safe(verificationSource, "OWNER_CONFIRMED") + ")"));
        lines.add(PdfLine.blank());

        lines.add(PdfLine.section("VERIFIED PAYMENT DETAILS"));
        lines.add(PdfLine.sub("Total Amount Paid: " + receipt.getCurrency() + " " + receipt.getAmount().toPlainString()));
        lines.add(PdfLine.text("Remaining Invoice Balance: INR " + safe(remainingBalanceInr, "0.00")));
        lines.add(PdfLine.text("Payment Method: " + receipt.getPaymentMethod().name()));
        lines.add(PdfLine.text("UTR / Transaction Reference: " + safe(receipt.getReferenceNumber(), "-")));
        lines.add(PdfLine.text("Payment Timestamp: "
                + (receipt.getPaidAt() != null ? INSTANT_FMT.format(receipt.getPaidAt()) : "-")));
        lines.add(PdfLine.blank());

        lines.add(PdfLine.section("RESIDENT & PROPERTY DETAILS"));
        lines.add(PdfLine.text("Resident: " + safe(receipt.getResidentName(), "-") + " (" + safe(receipt.getResidentPhone(), "-") + ")"));
        lines.add(PdfLine.text("Property: " + safe(receipt.getPropertyName(), "-")));
        lines.add(PdfLine.text("Floor: " + floorNumber
                + "  |  Room: " + safe(receipt.getRoomNumber(), "-")
                + "  |  Bed: " + safe(receipt.getBedNumber(), "-")));
        lines.add(PdfLine.text("Invoice #: " + safe(receipt.getInvoiceNumber(), "-")
                + "  |  Billing Month: " + safe(billingMonthLabel, "-")));
        if (receipt.getNotes() != null && !receipt.getNotes().isBlank()) {
            lines.add(PdfLine.text("Remarks: " + receipt.getNotes()));
        }
        lines.add(PdfLine.blank());
        lines.add(PdfLine.text("Generated after verified reconciliation against PG owner bank account / statement."));

        return renderSimplePdf(lines);
    }

    private byte[] renderSimplePdf(List<PdfLine> lines) {
        StringBuilder stream = new StringBuilder();
        // Top header accent bar (#142B4A Midnight Navy)
        stream.append("0.078 0.169 0.290 rg 36 756 523 50 re f\n");
        // Tangerine underline (#FF8C42)
        stream.append("1.000 0.549 0.259 rg 36 752 523 4 re f\n");

        int y = 782;
        boolean headerDrawn = false;
        for (PdfLine line : lines) {
            if (line.text.isEmpty()) {
                y -= 10;
                continue;
            }
            String safeText = escapePdfString(sanitizeAscii(line.text));
            if (!headerDrawn && line.isHeading) {
                stream.append("BT /F2 14 Tf 1.000 1.000 1.000 rg 46 ").append(y).append(" Td (")
                        .append(safeText).append(") Tj ET\n");
                y = 730;
                headerDrawn = true;
                continue;
            }
            if (line.isSection) {
                stream.append("0.918 0.965 1.000 rg 36 ").append(y - 4).append(" 523 18 re f\n");
                stream.append("BT /F2 10 Tf 0.078 0.169 0.290 rg 42 ").append(y).append(" Td (")
                        .append(safeText).append(") Tj ET\n");
                y -= 20;
            } else if (line.isSub) {
                stream.append("BT /F2 10 Tf 0.078 0.169 0.290 rg 42 ").append(y).append(" Td (")
                        .append(safeText).append(") Tj ET\n");
                y -= 16;
            } else {
                stream.append("BT /F1 10 Tf 0.120 0.160 0.220 rg 42 ").append(y).append(" Td (")
                        .append(safeText).append(") Tj ET\n");
                y -= 15;
            }
            if (y < 48) {
                break;
            }
        }

        byte[] contentBytes = stream.toString().getBytes(StandardCharsets.US_ASCII);
        List<Integer> offsets = new ArrayList<>();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        writeAscii(out, "%PDF-1.4\n");

        // 1: Catalog
        offsets.add(out.size());
        writeAscii(out, "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

        // 2: Pages
        offsets.add(out.size());
        writeAscii(out, "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

        // 3: Page (A4 = 595 x 842)
        offsets.add(out.size());
        writeAscii(out, "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
                + "/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n");

        // 4: Helvetica regular
        offsets.add(out.size());
        writeAscii(out, "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");

        // 5: Helvetica bold
        offsets.add(out.size());
        writeAscii(out, "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n");

        // 6: Page Content Stream
        offsets.add(out.size());
        writeAscii(out, "6 0 obj\n<< /Length " + contentBytes.length + " >>\nstream\n");
        out.write(contentBytes, 0, contentBytes.length);
        writeAscii(out, "\nendstream\nendobj\n");

        int xrefStart = out.size();
        writeAscii(out, "xref\n0 " + (offsets.size() + 1) + "\n");
        writeAscii(out, "0000000000 65535 f \n");
        for (int off : offsets) {
            writeAscii(out, String.format("%010d 00000 n \n", off));
        }
        writeAscii(out, "trailer\n<< /Size " + (offsets.size() + 1) + " /Root 1 0 R >>\n");
        writeAscii(out, "startxref\n" + xrefStart + "\n%%EOF\n");
        return out.toByteArray();
    }

    private void writeAscii(ByteArrayOutputStream out, String text) {
        byte[] bytes = text.getBytes(StandardCharsets.US_ASCII);
        out.write(bytes, 0, bytes.length);
    }

    private String sanitizeAscii(String input) {
        StringBuilder sb = new StringBuilder(input.length());
        for (int i = 0; i < input.length(); i++) {
            char c = input.charAt(i);
            sb.append(c >= 32 && c <= 126 ? c : ' ');
        }
        return sb.toString();
    }

    private String escapePdfString(String s) {
        return s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)");
    }

    private String safe(String val, String fallback) {
        return (val == null || val.isBlank()) ? fallback : val.trim();
    }

    private record PdfLine(String text, boolean isHeading, boolean isSection, boolean isSub) {
        static PdfLine heading(String t) { return new PdfLine(t, true, false, false); }
        static PdfLine section(String t) { return new PdfLine(t, false, true, false); }
        static PdfLine sub(String t) { return new PdfLine(t, false, false, true); }
        static PdfLine text(String t) { return new PdfLine(t, false, false, false); }
        static PdfLine blank() { return new PdfLine("", false, false, false); }
    }
}
