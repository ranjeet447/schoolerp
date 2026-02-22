import fs from 'fs';
import path from 'path';

const featuresPath = path.join(process.cwd(), 'packages/ui/src/data/features.ts');
const useCasesPath = path.join(process.cwd(), 'packages/ui/src/data/use-cases.ts');

function expandFeatures() {
  let content = fs.readFileSync(featuresPath, 'utf8');

  // Add seoLines property to FeatureItem interface
  content = content.replace(
    /mockUI: \{/g,
    `seoContent?: string[];\n  mockUI: {`
  );

  // We will find each longDescription and inject an array of seoContent strings after it.
  content = content.replace(/longDescription: "(.*?)",/g, (match, p1) => {
    return `${match}
    seoContent: [
      "Implementing this module transforms the way your institution handles daily operations. Instead of relying on manual data entry and fragmented systems, our platform centralizes everything. This ensures that every stakeholder—from the principal to the administrative staff—has real-time access to accurate data. The immediate result is a drastic reduction in clerical errors and an increase in overall productivity.",
      "Security and compliance are at the forefront of our architecture. Every transaction and data modification is logged, providing a clear audit trail that is crucial for regulatory inspections. Our system is built to scale, easily accommodating the growing needs of budget and private schools across India without compromising on performance or reliability."
    ],`;
  });

  fs.writeFileSync(featuresPath, content);
  console.log('Expanded features.ts');
}

function expandUseCases() {
  let content = fs.readFileSync(useCasesPath, 'utf8');

  // Add seoContent property to UseCaseDetail interface
  content = content.replace(
    /relatedFeatures: string\[\];/g,
    `relatedFeatures: string[];\n  seoContent?: string[];`
  );

  // We will find each longDescription and inject an array of seoContent strings after it.
  content = content.replace(/longDescription: "(.*?)",/g, (match, p1) => {
    return `${match}
    seoContent: [
      "In the modern educational landscape, solving administrative bottlenecks is essential for growth. This use case highlights how our comprehensive ERP system addresses core operational challenges by streamlining workflows that traditionally consume hours of staff time. By automating these repetitive tasks, schools can redirect their resources towards improving educational outcomes and student engagement.",
      "Furthermore, adopting this solution enhances transparency and builds robust trust with parents. When parents receive timely, accurate updates regarding their child's progress and school activities, their satisfaction increases. This not only aids in student retention but also serves as a strong marketing asset, differentiating your institution in a highly competitive market."
    ],`;
  });

  fs.writeFileSync(useCasesPath, content);
  console.log('Expanded use-cases.ts');
}

expandFeatures();
expandUseCases();
