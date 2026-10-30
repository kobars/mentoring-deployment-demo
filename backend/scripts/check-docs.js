// Memastikan openapi.json valid sebelum di-deploy.
import { fileURLToPath } from 'node:url';
import SwaggerParser from '@apidevtools/swagger-parser';

const spec = await SwaggerParser.validate(
  fileURLToPath(new URL('../docs/openapi.json', import.meta.url))
);
const operations = Object.values(spec.paths).flatMap(Object.keys).length;
console.log(`OpenAPI valid: ${Object.keys(spec.paths).length} path, ${operations} operation.`);
