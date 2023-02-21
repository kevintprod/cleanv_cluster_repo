import db from '../util/database.js';

const GetCSVData = async (filepath) => {
  try {
    const param = { Bucket: CONFIG_AWS.aws_s3_bucket_name, Key: filepath };

    const s3data = await s3.getObject(param).promise();
    const csvarray = await csvFileToArray(s3data);
    const insertcolumns = csvarray[0].replace(/"/g, '').split(',');

    csvarray.shift();
    let rowdata = [];
    const insertcolumnlength = insertcolumns.length;

    for await (let data of csvarray) {
      if (!data.trim()) continue;

      if (data.match(/""/g)) {
        data = data.replace(/""/g, '');
      }

      const resdata = await CSVtoArray(data, ',');
      let datalength = resdata[0].length;

      if (datalength !== insertcolumnlength) {
        if (datalength < insertcolumnlength) {
          let diff = Math.abs(datalength - insertcolumnlength);
          let arrayfill = Array(diff).fill('');

          let newdata = [...resdata[0], ...arrayfill];
          rowdata.push(newdata);
        } else if (datalength > insertcolumnlength) {
        }
      } else {
        rowdata.push(resdata[0]);
      }
    }

    return { insertcolumns, rowdata };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const InsertCSVDatatoDB = async (rowdata, tablename, insertheaders) => {
  const InsertQueryFromCSV = `INSERT INTO \`${tablename}\` (${insertheaders.toString()}) 
                               VALUES ${rowdata.map((col) => '(?)').join(',')}`;

  const [results, metadata] = await db2.sequelize.query(InsertQueryFromCSV, {
    replacements: rowdata,
    type: QueryTypes.INSERT,
  });
  return metadata;
};

export const ProcessFile = async (reqdata) => {
  const tablecolumns = ['return', 'result', 'return_long', 'remove_reason_l'];
  const { fileId, job } = reqdata;

  try {
    const columns = tablecolumns.map(
      (column) => `\`${column.toLowerCase().trim()}\` varchar(150)`
    );
    await job.updateProgress(50);

    const DropIfExistandQuery = `DROP TABLE IF EXISTS \`${fileId}\`;`;
    const CreateTableQuery = `CREATE TABLE \`${fileId}\` (${columns.toString()});`;

    await db.sequelize.query(DropIfExistandQuery);
    await db.sequelize.query(CreateTableQuery);
    await job.updateProgress(100);

    return true;
  } catch (error) {
    throw error;
  }
};
