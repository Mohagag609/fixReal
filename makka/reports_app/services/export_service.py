import io
import json
import csv
from datetime import datetime
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.units import inch
import pandas as pd

class ExportService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
    
    def generate_pdf_report(self, title, data, headers=None):
        """توليد تقرير PDF"""
        try:
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
            
            # المحتوى
            story = []
            
            # العنوان
            title_style = self.styles['Title']
            title_style.alignment = 1  # وسط
            story.append(Paragraph(title, title_style))
            story.append(Spacer(1, 12))
            
            # تاريخ التقرير
            date_style = self.styles['Normal']
            date_style.alignment = 1  # وسط
            story.append(Paragraph(f"تاريخ التقرير: {datetime.now().strftime('%Y-%m-%d %H:%M')}", date_style))
            story.append(Spacer(1, 20))
            
            # الجدول
            if data and len(data) > 0:
                # تحديد العناوين
                if not headers:
                    headers = list(data[0].keys()) if hasattr(data[0], 'keys') else []
                
                # تحضير البيانات
                table_data = [headers]
                for item in data:
                    row = []
                    for header in headers:
                        if hasattr(item, header):
                            value = getattr(item, header)
                        elif isinstance(item, dict) and header in item:
                            value = item[header]
                        else:
                            value = ''
                        
                        # تحويل التاريخ والوقت
                        if hasattr(value, 'strftime'):
                            value = value.strftime('%Y-%m-%d')
                        elif value is None:
                            value = ''
                        
                        row.append(str(value))
                    table_data.append(row)
                
                # إنشاء الجدول
                table = Table(table_data)
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 14),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('FONTSIZE', (0, 1), (-1, -1), 10),
                ]))
                
                story.append(table)
            else:
                story.append(Paragraph("لا توجد بيانات للعرض", self.styles['Normal']))
            
            # بناء PDF
            doc.build(story)
            buffer.seek(0)
            
            return buffer.getvalue()
            
        except Exception as e:
            raise Exception(f'خطأ في توليد PDF: {str(e)}')
    
    def generate_excel_report(self, title, data, headers=None):
        """توليد تقرير Excel"""
        try:
            # تحضير البيانات
            if not data:
                return b''
            
            # تحديد العناوين
            if not headers:
                if hasattr(data[0], '__dict__'):
                    headers = list(data[0].__dict__.keys())
                elif isinstance(data[0], dict):
                    headers = list(data[0].keys())
                else:
                    headers = []
            
            # تحويل البيانات إلى قائمة
            data_list = []
            for item in data:
                row = {}
                for header in headers:
                    if hasattr(item, header):
                        value = getattr(item, header)
                    elif isinstance(item, dict) and header in item:
                        value = item[header]
                    else:
                        value = ''
                    
                    # تحويل التاريخ والوقت
                    if hasattr(value, 'strftime'):
                        value = value.strftime('%Y-%m-%d %H:%M')
                    elif value is None:
                        value = ''
                    
                    row[header] = value
                data_list.append(row)
            
            # إنشاء DataFrame
            df = pd.DataFrame(data_list)
            
            # إنشاء Excel
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                df.to_excel(writer, sheet_name=title, index=False)
                
                # تنسيق الورقة
                workbook = writer.book
                worksheet = writer.sheets[title]
                
                # تنسيق العناوين
                header_format = workbook.add_format({
                    'bold': True,
                    'text_wrap': True,
                    'valign': 'top',
                    'fg_color': '#D7E4BC',
                    'border': 1
                })
                
                # تطبيق التنسيق على العناوين
                for col_num, value in enumerate(df.columns.values):
                    worksheet.write(0, col_num, value, header_format)
                
                # تعديل عرض الأعمدة
                for i, col in enumerate(df.columns):
                    max_length = max(
                        df[col].astype(str).map(len).max(),
                        len(str(col))
                    )
                    worksheet.set_column(i, i, min(max_length + 2, 50))
            
            output.seek(0)
            return output.getvalue()
            
        except Exception as e:
            raise Exception(f'خطأ في توليد Excel: {str(e)}')
    
    def generate_csv_report(self, title, data, headers=None):
        """توليد تقرير CSV"""
        try:
            if not data:
                return b''
            
            # تحديد العناوين
            if not headers:
                if hasattr(data[0], '__dict__'):
                    headers = list(data[0].__dict__.keys())
                elif isinstance(data[0], dict):
                    headers = list(data[0].keys())
                else:
                    headers = []
            
            # إنشاء CSV
            output = io.StringIO()
            writer = csv.writer(output)
            
            # كتابة العناوين
            writer.writerow(headers)
            
            # كتابة البيانات
            for item in data:
                row = []
                for header in headers:
                    if hasattr(item, header):
                        value = getattr(item, header)
                    elif isinstance(item, dict) and header in item:
                        value = item[header]
                    else:
                        value = ''
                    
                    # تحويل التاريخ والوقت
                    if hasattr(value, 'strftime'):
                        value = value.strftime('%Y-%m-%d %H:%M')
                    elif value is None:
                        value = ''
                    
                    row.append(str(value))
                writer.writerow(row)
            
            csv_content = output.getvalue()
            output.close()
            
            return csv_content.encode('utf-8')
            
        except Exception as e:
            raise Exception(f'خطأ في توليد CSV: {str(e)}')
    
    def generate_json_report(self, title, data):
        """توليد تقرير JSON"""
        try:
            # تحويل البيانات إلى قائمة
            data_list = []
            for item in data:
                if hasattr(item, '__dict__'):
                    item_dict = item.__dict__.copy()
                    # إزالة الحقول الداخلية
                    item_dict.pop('_state', None)
                    data_list.append(item_dict)
                elif isinstance(item, dict):
                    data_list.append(item)
                else:
                    data_list.append(str(item))
            
            # إنشاء JSON
            report_data = {
                'title': title,
                'generated_at': datetime.now().isoformat(),
                'data': data_list,
                'count': len(data_list)
            }
            
            return json.dumps(report_data, ensure_ascii=False, indent=2).encode('utf-8')
            
        except Exception as e:
            raise Exception(f'خطأ في توليد JSON: {str(e)}')
    
    def generate_custom_report(self, template, data, format_type='pdf'):
        """توليد تقرير مخصص"""
        try:
            if format_type == 'pdf':
                return self.generate_pdf_report(template['title'], data, template.get('headers'))
            elif format_type == 'excel':
                return self.generate_excel_report(template['title'], data, template.get('headers'))
            elif format_type == 'csv':
                return self.generate_csv_report(template['title'], data, template.get('headers'))
            elif format_type == 'json':
                return self.generate_json_report(template['title'], data)
            else:
                raise Exception('نوع التقرير غير مدعوم')
                
        except Exception as e:
            raise Exception(f'خطأ في توليد التقرير المخصص: {str(e)}')

# إنشاء مثيل الخدمة
export_service = ExportService()