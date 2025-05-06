import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import * as util from 'util';

const execPromise = util.promisify(exec);

async function generateTypes() {
  try {
    console.log('Generating OpenAPI TypeScript types...');
    
    const openapiPath = path.resolve(__dirname, '../docs/api/openapi.yaml');
    const outputPath = path.resolve(__dirname, '../src/types/api.ts');
    
    // If the directory does not exist, create it
    const typesDir = path.dirname(outputPath);
    if (!fs.existsSync(typesDir)) {
      fs.mkdirSync(typesDir, { recursive: true });
    }
    
    // Generate types using openapi-typescript
    const command = `npx openapi-typescript ${openapiPath} --output ${outputPath}`;
    const { stderr } = await execPromise(command);
    
    if (stderr && !stderr.includes('DeprecationWarning')) {
      console.error('Error:', stderr);
      if (stderr.includes('Error:')) {
        return;
      }
    }
    
    console.log(`interface successfully generated: ${outputPath}`);
    
    // Generate barrel file (for exporting types)
    const indexPath = path.resolve(typesDir, 'index.ts');
    fs.writeFileSync(indexPath, `export * from './api';\n`);
    console.log(`index file successfully generated: ${indexPath}`);
  } catch (error) {
    console.error('something went wrong:', error);
    process.exit(1);
  }
}

generateTypes(); 