/**
 * Extract PDF to Markdown
 * 
 * Converts PDF files to markdown format for KB
 * 
 * Usage:
 *   node scripts/extract-pdf-to-markdown.js <pdf-file> <output-md-file>
 * 
 * Example:
 *   node scripts/extract-pdf-to-markdown.js "../docs/expertise/Janet's Medium Articles.pdf" "../docs/expertise/medium-articles.md"
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function extractPDFToMarkdown(pdfPath, outputPath) {
  console.log('📄 PDF to Markdown Extractor\n');
  console.log(`Input:  ${pdfPath}`);
  console.log(`Output: ${outputPath}\n`);

  try {
    // Try to use pdf-parse if available
    let pdfText = '';
    
    try {
      const pdfParse = await import('pdf-parse');
      const pdfBuffer = readFileSync(pdfPath);
      const pdfData = await pdfParse.default(pdfBuffer);
      pdfText = pdfData.text;
      console.log(`✅ Extracted ${pdfData.numpages} pages`);
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        console.log('⚠️  pdf-parse not installed. Installing...');
        console.log('   Run: npm install pdf-parse');
        console.log('\n📝 Manual extraction required:');
        console.log('   1. Open the PDF');
        console.log('   2. Copy the text content');
        console.log('   3. Paste into the markdown template below\n');
        
        // Create template
        const template = `# Janet's Medium Articles

## Summary
[Add a brief summary of the articles - what topics, themes, and key insights they cover]

## Key Points
- [Key insight or article topic 1]
- [Key insight or article topic 2]
- [Key insight or article topic 3]
- [Key insight or article topic 4]
- [Continue adding key points...]

## Details
[Paste the full content or excerpts from the articles here]
[Include important quotes, examples, case studies]
[Any specific details that should be referenced when answering questions about Janet's writing]

---
**Source**: Janet's Medium Articles.pdf
**Last Updated**: ${new Date().toISOString().split('T')[0]}
`;
        
        writeFileSync(outputPath, template, 'utf-8');
        console.log(`✅ Created template: ${outputPath}`);
        console.log('   Please edit this file and add the PDF content.\n');
        return;
      } else {
        throw error;
      }
    }

    // Format as markdown
    const lines = pdfText.split('\n').filter(line => line.trim());
    
    // Create markdown structure
    let markdown = `# Janet's Medium Articles\n\n`;
    markdown += `## Summary\n`;
    markdown += `[Extracted from PDF - please review and refine]\n\n`;
    markdown += `## Key Points\n`;
    
    // Extract key points (look for bullet points, headings, etc.)
    const keyPoints = [];
    let inKeySection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for headings or bullet points
      if (line.match(/^[-•*]\s+/) || line.match(/^\d+\.\s+/)) {
        keyPoints.push(line.replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, ''));
      } else if (line.length > 50 && line.length < 200 && !line.match(/^[A-Z\s]+$/)) {
        // Potential key point (medium length, not all caps)
        if (keyPoints.length < 20) { // Limit to 20 key points
          keyPoints.push(line);
        }
      }
    }
    
    // Add key points
    if (keyPoints.length > 0) {
      keyPoints.slice(0, 15).forEach(point => {
        markdown += `- ${point}\n`;
      });
    } else {
      markdown += `- [Add key points from articles]\n`;
    }
    
    markdown += `\n## Details\n\n`;
    markdown += `[Full content extracted from PDF]\n\n`;
    markdown += `\`\`\`\n`;
    markdown += pdfText.substring(0, 5000); // First 5000 chars
    if (pdfText.length > 5000) {
      markdown += `\n\n... [Content truncated - see PDF for full text]\n`;
    }
    markdown += `\`\`\`\n\n`;
    markdown += `---\n`;
    markdown += `**Source**: ${pdfPath.split('/').pop()}\n`;
    markdown += `**Extracted**: ${new Date().toISOString().split('T')[0]}\n`;
    markdown += `**Note**: Please review and refine the extracted content\n`;

    // Write markdown file
    writeFileSync(outputPath, markdown, 'utf-8');
    
    console.log(`✅ Markdown file created: ${outputPath}`);
    console.log(`   Content length: ${markdown.length} characters`);
    console.log(`   Key points extracted: ${keyPoints.length}`);
    console.log(`\n⚠️  Please review and refine the extracted content!\n`);
    
  } catch (error) {
    console.error('❌ Error extracting PDF:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node extract-pdf-to-markdown.js <pdf-file> <output-md-file>');
  console.log('\nExample:');
  console.log(`  node extract-pdf-to-markdown.js "../docs/expertise/Janet's Medium Articles.pdf" "../docs/expertise/medium-articles.md"`);
  process.exit(1);
}

const pdfPath = join(__dirname, args[0]);
const outputPath = join(__dirname, args[1]);

extractPDFToMarkdown(pdfPath, outputPath).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
