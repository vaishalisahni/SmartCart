#!/usr/bin/env python3
"""
generateInvoice.py — creates a professional SmartCart invoice PDF
Usage: python3 generateInvoice.py <data_json_path> <output_pdf_path>
"""
import json
import sys
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT

# ── Brand colours ─────────────────────────────────────────────
TEAL       = colors.HexColor('#247370')
TEAL_LIGHT = colors.HexColor('#eef7f6')
TEAL_MID   = colors.HexColor('#aeddda')
DARK       = colors.HexColor('#0a1f1e')
MUTED      = colors.HexColor('#5f9290')
WHITE      = colors.white
AMBER      = colors.HexColor('#f59e0b')

W, H = A4  # 210 × 297 mm

def make_invoice(data: dict, output_path: str):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=18*mm, bottomMargin=18*mm,
        title=f"SmartCart Invoice #{data['orderShortId']}",
        author="SmartCart",
    )

    styles = getSampleStyleSheet()

    # ── Custom styles ─────────────────────────────────────────
    brand = ParagraphStyle('brand', fontSize=22, textColor=TEAL,
                            fontName='Helvetica-Bold', spaceAfter=1)
    tagline = ParagraphStyle('tagline', fontSize=7.5, textColor=MUTED,
                              fontName='Helvetica', spaceAfter=0)
    h1 = ParagraphStyle('h1', fontSize=18, textColor=DARK,
                         fontName='Helvetica-Bold', spaceAfter=4)
    label = ParagraphStyle('label', fontSize=7, textColor=MUTED,
                            fontName='Helvetica-Bold', spaceBefore=6,
                            spaceAfter=1, leading=9)
    value = ParagraphStyle('value', fontSize=9, textColor=DARK,
                            fontName='Helvetica', spaceAfter=2, leading=12)
    bold_value = ParagraphStyle('bold_value', fontSize=9, textColor=DARK,
                                 fontName='Helvetica-Bold', spaceAfter=2)
    small = ParagraphStyle('small', fontSize=7.5, textColor=MUTED,
                            fontName='Helvetica', leading=11)
    footer_style = ParagraphStyle('footer', fontSize=7.5, textColor=MUTED,
                                   fontName='Helvetica', alignment=TA_CENTER)
    right_bold = ParagraphStyle('right_bold', fontSize=10, textColor=DARK,
                                  fontName='Helvetica-Bold', alignment=TA_RIGHT)
    total_style = ParagraphStyle('total', fontSize=13, textColor=TEAL,
                                  fontName='Helvetica-Bold', alignment=TA_RIGHT)

    story = []

    # ══════════════════════════════════════════════════════════
    # HEADER — brand left, invoice info right
    # ══════════════════════════════════════════════════════════
    status_color = {
        'Delivered': colors.HexColor('#22c55e'),
        'Shipped':   colors.HexColor('#f97316'),
        'Placed':    TEAL,
        'Cancelled': colors.HexColor('#ef4444'),
        'Refunded':  colors.HexColor('#8b5cf6'),
    }.get(data['orderStatus'], TEAL)

    header_data = [[
        # Left cell — brand block
        [
            Paragraph('SmartCart', brand),
            Paragraph('AI-Powered E-Commerce · India', tagline),
            Spacer(1, 4),
            Paragraph('support@smartcart.in  |  +91 98765 43210', small),
            Paragraph('Dehradun, Uttarakhand, India', small),
        ],
        # Right cell — invoice meta
        [
            Paragraph('INVOICE', h1),
            Paragraph(f'# {data["orderShortId"]}', bold_value),
            Spacer(1, 6),
            Paragraph('ORDER DATE', label),
            Paragraph(data['createdAt'], value),
            Paragraph('PAYMENT', label),
            Paragraph(data['paymentMethod'], value),
            Paragraph('STATUS', label),
            Paragraph(
                f'<font color="{status_color.hexval()}"><b>{data["orderStatus"]}</b></font>',
                value
            ),
        ],
    ]]

    header_table = Table(header_data, colWidths=[90*mm, 80*mm])
    header_table.setStyle(TableStyle([
        ('VALIGN',      (0,0), (-1,-1), 'TOP'),
        ('ALIGN',       (1,0), (1,0),   'RIGHT'),
        ('LINEBELOW',   (0,0), (-1,0),  0.8, TEAL_MID),
        ('BOTTOMPADDING', (0,0), (-1,0), 10),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 8))

    # ══════════════════════════════════════════════════════════
    # BILLING / SHIPPING ADDRESS
    # ══════════════════════════════════════════════════════════
    s = data['shipping']
    c = data['customer']

    addr_data = [[
        [
            Paragraph('BILL TO', label),
            Paragraph(f'<b>{c["name"]}</b>', bold_value),
            Paragraph(c['email'], value),
            Paragraph(c['phone'] or '', value),
        ],
        [
            Paragraph('SHIP TO', label),
            Paragraph(f'<b>{s.get("fullName","")}</b>', bold_value),
            Paragraph(s.get('street',''), value),
            Paragraph(f'{s.get("city","")}, {s.get("state","")} - {s.get("pincode","")}', value),
            Paragraph(s.get('phone',''), value),
        ],
    ]]

    addr_table = Table(addr_data, colWidths=[85*mm, 85*mm])
    addr_table.setStyle(TableStyle([
        ('VALIGN',         (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND',     (0,0), (-1,-1), TEAL_LIGHT),
        ('ROUNDEDCORNERS', [6,6,6,6]),
        ('TOPPADDING',     (0,0), (-1,-1), 8),
        ('BOTTOMPADDING',  (0,0), (-1,-1), 8),
        ('LEFTPADDING',    (0,0), (-1,-1), 10),
        ('RIGHTPADDING',   (0,0), (-1,-1), 10),
        ('LINEAFTER',      (0,0), (0,-1),  0.5, TEAL_MID),
    ]))
    story.append(addr_table)
    story.append(Spacer(1, 12))

    # ══════════════════════════════════════════════════════════
    # ITEMS TABLE
    # ══════════════════════════════════════════════════════════
    th_style = ParagraphStyle('th', fontSize=8, textColor=WHITE,
                               fontName='Helvetica-Bold', alignment=TA_LEFT)
    th_right = ParagraphStyle('th_r', fontSize=8, textColor=WHITE,
                               fontName='Helvetica-Bold', alignment=TA_RIGHT)
    td_style = ParagraphStyle('td', fontSize=8.5, textColor=DARK,
                               fontName='Helvetica', leading=12)
    td_right = ParagraphStyle('td_r', fontSize=8.5, textColor=DARK,
                               fontName='Helvetica', alignment=TA_RIGHT, leading=12)

    item_rows = [
        [
            Paragraph('#',           th_style),
            Paragraph('Item',        th_style),
            Paragraph('Qty',         th_right),
            Paragraph('Unit Price',  th_right),
            Paragraph('Amount',      th_right),
        ]
    ]

    for idx, item in enumerate(data['items'], 1):
        item_rows.append([
            Paragraph(str(idx), td_style),
            Paragraph(item['name'], td_style),
            Paragraph(str(item['quantity']), td_right),
            Paragraph(f'Rs. {item["price"]:,.0f}', td_right),
            Paragraph(f'Rs. {item["total"]:,.0f}', td_right),
        ])

    col_widths = [10*mm, 90*mm, 14*mm, 28*mm, 28*mm]
    items_table = Table(item_rows, colWidths=col_widths, repeatRows=1)

    row_count = len(item_rows)
    items_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND',    (0,0), (-1,0),      TEAL),
        ('TOPPADDING',    (0,0), (-1,0),      7),
        ('BOTTOMPADDING', (0,0), (-1,0),      7),
        # Body rows
        ('BACKGROUND',    (0,1), (-1,-1),     WHITE),
        ('ROWBACKGROUNDS',(0,1), (-1,-1),     [WHITE, TEAL_LIGHT]),
        ('TOPPADDING',    (0,1), (-1,-1),     5),
        ('BOTTOMPADDING', (0,1), (-1,-1),     5),
        ('LEFTPADDING',   (0,0), (-1,-1),     6),
        ('RIGHTPADDING',  (0,0), (-1,-1),     6),
        ('VALIGN',        (0,0), (-1,-1),     'MIDDLE'),
        ('LINEBELOW',     (0,-1), (-1,-1),    0.8, TEAL_MID),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 8))

    # ══════════════════════════════════════════════════════════
    # TOTALS BLOCK  (right-aligned)
    # ══════════════════════════════════════════════════════════
    def money(n): return f'Rs. {float(n):,.0f}'

    totals_rows = [
        ['Subtotal',  money(data['itemsPrice'])],
        ['GST (18%)', money(data['taxPrice'])],
        ['Shipping',  'FREE' if data['shippingPrice'] == 0 else money(data['shippingPrice'])],
    ]
    if data.get('discountAmount', 0) > 0:
        lbl = f'Discount ({data["couponCode"]})' if data.get('couponCode') else 'Discount'
        totals_rows.append([lbl, f'- {money(data["discountAmount"])}'])

    totals_rows.append(['TOTAL', money(data['totalPrice'])])

    totals_style_list = []
    sub_row_count = len(totals_rows)

    for i, row in enumerate(totals_rows):
        is_last = (i == sub_row_count - 1)
        totals_rows[i] = [
            Paragraph(row[0],
                       ParagraphStyle('tl', fontSize=9 if not is_last else 11,
                                       textColor=MUTED if not is_last else TEAL,
                                       fontName='Helvetica-Bold' if is_last else 'Helvetica',
                                       alignment=TA_RIGHT)),
            Paragraph(row[1],
                       ParagraphStyle('tr', fontSize=9 if not is_last else 11,
                                       textColor=DARK if not is_last else TEAL,
                                       fontName='Helvetica-Bold',
                                       alignment=TA_RIGHT)),
        ]

    totals_table = Table(totals_rows, colWidths=[50*mm, 40*mm],
                          hAlign='RIGHT')
    totals_table.setStyle(TableStyle([
        ('TOPPADDING',    (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('RIGHTPADDING',  (0,0), (-1,-1), 0),
        ('LINEABOVE',     (0,sub_row_count-1), (-1,sub_row_count-1), 1, TEAL),
        ('TOPPADDING',    (0,sub_row_count-1), (-1,sub_row_count-1), 6),
    ]))
    story.append(totals_table)

    # ══════════════════════════════════════════════════════════
    # NOTES / POLICY
    # ══════════════════════════════════════════════════════════
    story.append(Spacer(1, 14))
    story.append(HRFlowable(width='100%', thickness=0.5, color=TEAL_MID))
    story.append(Spacer(1, 8))

    notes_data = [[
        [
            Paragraph('RETURN POLICY', label),
            Paragraph('7-day easy returns from delivery date. Raise a return request from My Orders.', small),
        ],
        [
            Paragraph('PAYMENT', label),
            Paragraph(f'{data["paymentMethod"]}  |  Paid on {data["paidAt"]}', small),
        ],
        [
            Paragraph('NEED HELP?', label),
            Paragraph('support@smartcart.in  |  +91 98765 43210', small),
        ],
    ]]

    notes_table = Table(notes_data, colWidths=[57*mm, 57*mm, 56*mm])
    notes_table.setStyle(TableStyle([
        ('VALIGN',  (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING',  (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(notes_table)

    story.append(Spacer(1, 10))
    story.append(Paragraph(
        'Thank you for shopping with SmartCart! — AI-Powered Smart Shopping from India',
        footer_style
    ))

    doc.build(story)

# ── Entry point ───────────────────────────────────────────────
if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage: generateInvoice.py <data.json> <output.pdf>')
        sys.exit(1)

    data_path   = sys.argv[1]
    output_path = sys.argv[2]

    with open(data_path, 'r') as f:
        invoice_data = json.load(f)

    make_invoice(invoice_data, output_path)
    print(f'Invoice saved: {output_path}')