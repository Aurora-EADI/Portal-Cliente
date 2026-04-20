import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/App/app.module';
import { SqlServerService } from './src/prisma/sqlserver.service';

async function bootstrap() {
  console.log("Starting app context...");
  const app = await NestFactory.createApplicationContext(AppModule);
  const sqlServer = app.get(SqlServerService);
  
  console.log("Executing query...");
  try {
    const result = await sqlServer.query(`
      SELECT TOP 1 l.localizacao
      FROM localizacao l
    `, []);
    console.log("Success! Columns:", Object.keys(result[0] || {}));
    console.log("Sample:", result[0]);
  } catch (e) {
    console.error("QUERY ERROR:", e.message);
    
    // Fallback: list columns
    console.log("Trying to get columns instead...");
    try {
      const cols = await sqlServer.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'localizacao'
      `, []);
      console.log("Columns:", cols.map(c => c.COLUMN_NAME).join(', '));
    } catch (e2) {
      console.error(e2);
    }
  }
  await app.close();
}
bootstrap();
