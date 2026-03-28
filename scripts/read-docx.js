const mammoth = require('mammoth');

async function main() {
  const files = [
    'C:/Users/Jwells/OneDrive - The Cornerstone Group/Documents/Desktop/MSA_Project_Overview.docx',
    'C:/Users/Jwells/OneDrive - The Cornerstone Group/Documents/Desktop/Manager_Skills_Assessment_Final.docx',
    'C:/Users/Jwells/OneDrive - The Cornerstone Group/Documents/Desktop/MSA_Technical_Brief_for_Josh.docx'
  ];
  for (const f of files) {
    const name = f.split('/').pop();
    console.log('\n========== ' + name + ' ==========\n');
    const result = await mammoth.extractRawText({ path: f });
    console.log(result.value);
  }
}
main();
