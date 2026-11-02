from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether

out = r"C:\CollabSpace\CollabSpace_Progress_Report.pdf"
doc = SimpleDocTemplate(out, pagesize=letter, rightMargin=0.72*inch, leftMargin=0.72*inch, topMargin=0.55*inch, bottomMargin=0.55*inch)
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='Uni', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=13, leading=16, alignment=TA_CENTER, spaceAfter=4))
styles.add(ParagraphStyle(name='Dept', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11, leading=14, alignment=TA_CENTER, spaceAfter=9))
styles.add(ParagraphStyle(name='ReportTitle', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=12, leading=15, alignment=TA_CENTER, spaceAfter=4))
styles.add(ParagraphStyle(name='Body2', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.2, leading=12.4, spaceAfter=5))
styles.add(ParagraphStyle(name='Section2', parent=styles['Heading3'], fontName='Helvetica-Bold', fontSize=10.5, leading=13, spaceBefore=8, spaceAfter=4))
styles.add(ParagraphStyle(name='Field', parent=styles['BodyText'], fontName='Helvetica', fontSize=9, leading=12, leftIndent=10, spaceAfter=4))

story = [Paragraph('J. C. BOSE UNIVERSITY OF SCIENCE &amp; TECHNOLOGY, YMCA, FARIDABAD', styles['Uni']),
         Paragraph('DEPARTMENT OF COMPUTER ENGINEERING', styles['Dept']),
         Paragraph('Progress Report for B.Tech. Capstone Project', styles['ReportTitle']),
         Paragraph('1st Progress Report (March 2026 / April 2026)', styles['ReportTitle']), Spacer(1, 9)]
fields = [
    '<b>1. Name of Student:</b> Piyush',
    '<b>2. Name of Mentor:</b> Ms. Rachna',
    '<b>3. Roll No.:</b> 24001003097',
    '<b>4. Name and Roll No. of team member:</b> Sapna (23001003113)',
    '<b>5. Title of Project:</b> CollabSpace: Team Collaboration and Project Management Platform',
]
story += [Paragraph(x, styles['Field']) for x in fields]
story += [Paragraph('Progress Summary', styles['Section2']),
          Paragraph('CollabSpace is a full-stack team collaboration platform built with React, TypeScript, Node.js, Express.js, and PostgreSQL. It helps teams manage workspaces, projects, tasks, and delivery plans. The project has progressed through Day 70 of its roadmap, covering core collaboration capabilities and a scalable backend foundation.', styles['Body2']),
          Paragraph('The application includes workspace and project management, task tracking, authentication, role-aware access, and real-time collaboration. Its Execution page visualizes task dependencies and critical paths and supports outcomes, goals, milestones, and versioned execution plans. Roadmap work through Day 70 covers summary caching and measurement, workspace presence, multi-instance Socket.IO fanout, idempotent requests, authentication throttling, and queued invitation email delivery.', styles['Body2']),
          Paragraph('Tasks Completed', styles['Section2'])]
completed = [
    'Developed the frontend using React and TypeScript.',
    'Built REST API services using Node.js and Express.js, with PostgreSQL and Prisma ORM.',
    'Implemented user authentication and protected routes.',
    'Added workspace, project, and task management capabilities.',
    'Implemented real-time collaboration and workspace event updates.',
    'Built an Execution page for task dependencies, critical path, outcomes, goals, milestones, and execution plans.',
    'Added project summary caching with cache status and timing metrics, plus an opt-in benchmark.',
    'Added workspace presence and cross-instance Socket.IO fanout when Redis is configured.',
    'Implemented durable request idempotency and authentication throttling with Redis-backed shared limits and a development fallback.',
    'Added background invitation email processing with retries and a dead-letter queue when SMTP is configured.',
    'Documented Day 61–70 configuration, operation, and deployment requirements.',
]
story += [Paragraph('• ' + x, styles['Body2']) for x in completed]
story += [Paragraph('Tasks in Progress', styles['Section2'])]
inprogress = [
    'Validating the Day 61–70 features against configured PostgreSQL, Redis, and SMTP services.',
    'Running end-to-end checks and performance benchmarks in a configured environment.',
    'Preparing and reviewing deployment configuration for the frontend, API, database, Redis, and email worker.',
    'Continuing UI polish, accessibility improvements, and contributor onboarding.',
]
story += [Paragraph('• ' + x, styles['Body2']) for x in inprogress]
story += [Spacer(1, 9), Paragraph('<b>Date:</b> ____________________', styles['Body2']),
          Paragraph('<b>(Signature of Student)</b> __________________________________________', styles['Body2']),
          Spacer(1, 9), Paragraph('<b>Report of the Mentor</b>', styles['Section2']),
          Paragraph('(To be filled by mentor)', styles['Body2']), Spacer(1, 10),
          Paragraph('________________________________________________________________________________', styles['Body2']),
          Paragraph('<b>Signature of Mentor</b>', styles['Body2'])]
doc.build(story)
print(out)
