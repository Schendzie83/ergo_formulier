const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, Footer, ImageRun, AlignmentType } = require('docx');
const fs = require('fs');
const path = require('path');

class DocumentGenerator {
  static async generate(form, answers) {
    const FONT_FAMILY = "Avenir Next LT Pro";
    const children = [];
    
    // Title
    children.push(
      new Paragraph({
        children: [
            new TextRun({
                text: form.title,
                bold: true,
                size: 36, // 18pt
                font: FONT_FAMILY
            }),
        ],
        heading: HeadingLevel.TITLE,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
            new TextRun({
                text: form.description || '',
                font: FONT_FAMILY
            })
        ],
        spacing: { after: 400 },
      })
    );

    // 1. Build hierarchy map
    console.log('Generating document for form:', form.title);
    const questionsByParent = {};
    form.Questions.forEach(q => {
        const pid = q.parentId || 'root';
        if (!questionsByParent[pid]) questionsByParent[pid] = [];
        questionsByParent[pid].push(q);
    });

    Object.values(questionsByParent).forEach(list => list.sort((a, b) => a.orderIndex - b.orderIndex));

    // Helper: Option Lookup Map
    const optionMap = new Map();
    form.Questions.forEach(q => {
        if (q.Options) {
            q.Options.forEach(o => optionMap.set(String(o.id), o.text));
        }
    });

    // Helper: Logic Evaluator
    const isVisible = (question) => {
        if (!question.TargetRules || question.TargetRules.length === 0) return true;

        const showRules = question.TargetRules.filter(r => r.action === 'SHOW');
        const hideRules = question.TargetRules.filter(r => r.action === 'HIDE');

        let visible = true;

        // "SHOW" rules imply default hidden
        if (showRules.length > 0) visible = false;

        // Check SHOW rules
        if (showRules.length > 0) {
            const match = showRules.some(rule => {
                const ans = answers[rule.triggerQuestionId];
                if (ans === undefined || ans === null) return false;
                
                const triggerVal = String(rule.triggerOptionId);
                if (Array.isArray(ans)) {
                    return ans.map(String).includes(triggerVal);
                }
                return String(ans) === triggerVal;
            });
            if (match) visible = true;
        }

        // Check HIDE rules
        if (hideRules.length > 0) {
            const match = hideRules.some(rule => {
                const ans = answers[rule.triggerQuestionId];
                if (ans === undefined || ans === null) return false;
                
                const triggerVal = String(rule.triggerOptionId);
                if (Array.isArray(ans)) {
                    return ans.map(String).includes(triggerVal);
                }
                return String(ans) === triggerVal;
            });
            if (match) visible = false;
        }

        return visible;
    };

    // Helper: Get Answer Display
    const getAnswerDisplay = (item) => {
         const answer = answers[item.id];
         if (answer === undefined || answer === null || answer === '') return '';
         
         if (item.type === 'multiple_choice') {
             if (Array.isArray(answer)) {
                 return answer.map(id => optionMap.get(String(id)) || id).join(', ');
             }
             return optionMap.get(String(answer)) || answer;
         } else if (item.type === 'date') {
             return String(answer); 
         }
         return String(answer);
    };



    // Same recursive function, updated styles
    const buildSectionRows = (parentId, level = 0) => {
        const rows = [];
        const items = questionsByParent[parentId] || [];
        
        for (const item of items) {
            if (!isVisible(item)) continue;

            // Determine style based on level
            // User feedback: "Niveau 2 mag beetje kleiner, maar hoeft niet meer dikgedrukt"
            // We interpret "Niveau 2" as the questions directly under the main section.
            
            let fontSize = 24; // 12pt (was 28/14pt)
            if (level === 1) fontSize = 22; // 11pt
            if (level >= 2) fontSize = 20; // 10pt

            const isBold = false; 
            const indentLevel = level * 200; 

            if (item.type === 'section') {
                // Nested Section Header (Subtitle) -> Keep bold to distinguish?
                rows.push(new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({ 
                                    children: [new TextRun({ text: item.text, bold: true, size: fontSize + 2, font: FONT_FAMILY })], 
                                    indent: { left: indentLevel }
                                })
                            ],
                            columnSpan: 2,
                            shading: { fill: "F0F0F0" }, 
                        })
                    ]
                }));
                // Recurse
                rows.push(...buildSectionRows(item.id, level + 1));
            } else {
                // Question Row
                const answerText = getAnswerDisplay(item);
                rows.push(new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: item.text, bold: isBold, size: fontSize, font: FONT_FAMILY })],
                                    indent: { left: indentLevel }
                                })
                            ],
                            width: { size: 50, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: answerText, size: fontSize, font: FONT_FAMILY })]
                                })
                            ],
                            width: { size: 50, type: WidthType.PERCENTAGE }
                        })
                    ]
                }));
            }
        }
        return rows;
    };

    // Main Loop
    const rootItems = questionsByParent['root'] || [];
    for (const item of rootItems) {
        if (!isVisible(item)) continue;
        
        if (item.type === 'section') {
             const tableRows = [];
             // Header for Main Section (Big Header)
             tableRows.push(new TableRow({
                 children: [
                     new TableCell({
                         children: [
                             new Paragraph({ 
                                children: [
                                    new TextRun({ 
                                        text: item.text, 
                                        bold: true, 
                                        size: 36, // 18pt
                                        font: FONT_FAMILY
                                    })
                                ]
                             })
                         ], 
                         columnSpan: 2,
                         shading: { fill: "D0D0D0" } 
                     })
                 ]
             }));
             
             tableRows.push(...buildSectionRows(item.id));
             
             children.push(new Table({
                 rows: tableRows,
                 width: { size: 100, type: WidthType.PERCENTAGE },
             }));
             
             children.push(new Paragraph("")); // Spacer
             
        } else {
            // Root Question
            children.push(
                new Paragraph({
                  children: [new TextRun({ text: item.text, font: FONT_FAMILY, size: 28, bold: true })], // Root questions still bold? Or implied Level 1? Let's keep distinct.
                  heading: HeadingLevel.HEADING_3, 
                  spacing: { before: 200, after: 100 },
                })
            );

            const ans = getAnswerDisplay(item);
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: ans || "__________________________________________________",
                            bold: !!ans,
                            color: ans ? "000000" : "CCCCCC",
                            font: FONT_FAMILY
                        }),
                    ],
                })
            );
        }
    }

    // Load Image for Footer
    let footerChildren = [];
    try {
        const imagePath = path.join(__dirname, '../assets/zuyd-logo.png');
        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            footerChildren.push(
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new ImageRun({
                            data: imageBuffer,
                            transformation: {
                                width: 100,
                                height: 50, // Keep aspect ratio roughly
                            },
                        }),
                    ],
                })
            );
        }
    } catch (err) {
        console.error("Error loading footer image:", err);
    }


    const doc = new Document({
      sections: [{
        properties: {},
        children: children,
        footers: {
            default: new Footer({
                children: footerChildren
            })
        }
      }],
    });
    
    return await Packer.toBuffer(doc);
  }
}
module.exports = DocumentGenerator;
