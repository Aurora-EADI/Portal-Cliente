const sql = require('mssql');
const fs = require('fs');

const config = {
  server: '172.20.210.2',
  port: 1433,
  database: 'Aurora_M',
  user: 'PORTAL',
  password: 'Portal#123',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    cryptoCredentialsDetails: {
      minVersion: "TLSv1",
    },
  }
};

async function checkTable() {
  try {
    const pool = await sql.connect(config);
    
    const result = await pool.request().query("SELECT TOP 5 * FROM localizacao WHERE numero IN ('1', '2') OR numero IS NOT NULL");
    const colsResult = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'localizacao'");
    
    const output = {
      sample: result.recordsets[0],
      columns: colsResult.recordsets[0].map(r => r.COLUMN_NAME)
    };
    
    fs.writeFileSync('out.json', JSON.stringify(output, null, 2));
    
    pool.close();
  } catch (err) {
    fs.writeFileSync('out.json', JSON.stringify({ error: err.message }));
  }
}
checkTable();
