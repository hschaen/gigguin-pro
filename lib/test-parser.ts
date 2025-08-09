import { parseDJText } from './dj-text-parser';

// Test with your actual examples
const testCases = [
  {
    name: "Sophia ward / FIA Example",
    input: `1. Sophia ward (DJ Full Name)
2. FIA (DJ Name)
3. 512-712-2689 (phone)
4. djfiasounds@gmail.com (email)
5. @sophiaawardd (instagram)`
  },
  {
    name: "SAUL Example", 
    input: `SAUL
1. Jonathan Weinstein (DJ Full Name)
2. SAUL (DJ Name)
3. (858) 692-1601 (phone)
4. anotefromsaul@gmail.com (email)
5. @anotefromsaul (instagram)`
  },
  {
    name: "Ricardo Haynes Example",
    input: `Ricardo Haynes (DJ Full Name)
DJ SUNŚET (DJ Name)
8054537433 (phone)
Ricardohaynesmgmt@gmail.com (email)
Djsunset.fv (instagram)`
  }
];

export function runParserTests() {
  console.log('🧪 Testing DJ Text Parser\n');
  
  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log('Input:', testCase.input);
    console.log('---');
    
    const result = parseDJText(testCase.input);
    
    console.log('Success:', result.success);
    console.log('Data:', result.data);
    if (result.errors.length > 0) {
      console.log('Errors:', result.errors);
    }
    if (result.warnings.length > 0) {
      console.log('Warnings:', result.warnings);
    }
    console.log('\n');
  });
}