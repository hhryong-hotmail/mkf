// MKF system의 모든 server.js - 2025-07-03 09:22
require('dotenv').config()
const express = require('express')
const { Pool } = require('pg')
const path = require('path')
const multer = require('multer')

const app = express()
const port = process.env.PORT || 3000
const host = '0.0.0.0' // 모든 네트워크 인터페이스에서 접속 허용

// CORS 미들웨어 설정
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  )
  next()
})

// PostgreSQL 연결 설정
const pool = new Pool({
  user: process.env.DB_USER || 'mkfpartners',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mkf',
  password: process.env.DB_PASSWORD || 'mkfpartners',
  port: process.env.DB_PORT || 5432
})

// 데이터베이스 연결 테스트
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('데이터베이스 연결 오류:', err)
  } else {
    console.log('데이터베이스 연결 성공:', res.rows[0])
  }
})

// 정적 파일 제공 설정
app.use(express.static(path.join(__dirname, 'public')))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use(express.json())

// Multer 설정 - 이미지 파일 업로드용
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // 업로드된 파일이 저장될 폴더
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // 이미지 파일만 허용
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'), false)
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  }
})

// 업로드 폴더 생성
const fs = require('fs')
const uploadDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 기본 경로 처리
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// 서버 상태 확인용 엔드포인트
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ip: req.ip,
    headers: req.headers
  })
})

//상세 정보 조회
app.get('/api/records/:id', async (req, res) => {
  console.log(
    'Received request for app.get(/api/records/:id with query:',
    req.query
  )
  const { jobGubun } = req.query
  const table = jobGubun === 'E' ? 'error_table' : 'check_view'
  try {
    const { id } = req.params
    const query = `SELECT * FROM ${table} WHERE id = $1`
    console.log('id 상세조회 query:', query, 'params:', [id]) // 쿼리문과 파라미터 출력
    const result = await pool.query(query, [id])

    if (result.rows.length === 0) {
      res.status(404).json({ error: '데이터를 찾을 수 없습니다.' })
      return
    }

    const record = result.rows[0]

    res.json(record)
  } catch (err) {
    console.error('Error in /api/records/:id:', err)
    res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
})

// mkf_master 테이블에서 passport_number로 조회하는 API
app.get('/api/mkf-master-by-passport', async (req, res) => {
  console.log(
    'Received request for app.get(/api/records/:mkf-master-by-passport:',
    req.query
  )
  const { jobGubun } = req.query
  const table = jobGubun === 'E' ? 'error_table' : 'check_view'
  try {
    const { passport_number } = req.query // Use req.query for query parameters

    if (!passport_number) {
      return res
        .status(400)
        .json({ error: 'passport_number는 필수 파라미터입니다.' })
    }

    const query = `
      SELECT * FROM ${table} 
      WHERE passport_number = $1      
    `
    console.log(
      '${table} 조회 (by passport_number only) query:',
      query,
      'params:',
      [passport_number]
    )
    const result = await pool.query(query, [passport_number])

    if (result.rows.length === 0) {
      res.status(404).json({ error: '데이터를 찾을 수 없습니다.' })
      return
    }

    res.json(result.rows[0]) // assuming only one record is expected for a unique passport number
  } catch (err) {
    console.error('Error in /api/mkf-master-by-passport:', err)
    res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
})
app.get('/api/records/passport/:passport_number', async (req, res) => {
  console.log(
    'Received request for app.get(/api/records/passport/:passport_number with query:',
    req.query
  )
  const { jobGubun } = req.query
  const table = jobGubun === 'E' ? 'error_table' : 'check_view'
  try {
    const { passport_number } = req.params
    const query = `SELECT * FROM ${table} WHERE passport_number = $1`
    console.log('passport_number 조회 query:', query, 'params:', [
      passport_number
    ]) // 쿼리문과 파라미터 출력
    const result = await pool.query(query, [passport_number])

    if (result.rows.length === 0) {
      res.status(404).json({ error: '데이터를 찾을 수 없습니다.' })
      return
    }

    const record = result.rows[0]

    res.json(record)
  } catch (err) {
    console.error('Error in /api/records/:passport_number:', err)
    res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
})
// 전체 목록 또는 필터링된 목록 조회
app.get('/api/records', async (req, res) => {
  console.log(
    'Received request for app.get(/api/records with query:',
    req.query
  )
  const { jobGubun } = req.query
  const table = jobGubun === 'E' ? 'error_table' : 'mkf_master'
  try {
    console.log('서버에서 수신한 request:', req.query) // 요청 로깅
    const {
      id = null,
      nationality = 'Cambodia',
      name = '',
      passport_number = '',
      visa_type = '전체',
      commitDateFrom = null,
      commitDateTo = null
    } = req.query

    let query = `SELECT * FROM ${table}`
    let conditions = []
    let values = []
    let paramCount = 1
    const search_type = req.query.search_type
    const mkf_status = req.query.mkf_status

    console.log('search_type:=', search_type) 
    
    function addCondition (field, value, operator = '=') {
      if (value && value !== '전체' && value !== 'All') {
        conditions.push(`${field} ${operator} $${paramCount}`)
        values.push(value)
        paramCount++
      }
    }

    function parseAndValidateDate (dateString) {
      if (!/^\d{6}$/.test(dateString)) return null

      const year = parseInt('20' + dateString.substring(0, 2))
      const month = dateString.substring(2, 4)
      const day = dateString.substring(4, 6)

      if (isValidDate(year, month, day)) {
        return `${year}-${month}-${day}`
      }
      return null
    }

    function isValidDate (year, month, day) {
      const date = new Date(`${year}-${month}-${day}`)
      return (
        date.getFullYear() === parseInt(year) &&
        date.getMonth() + 1 === parseInt(month) &&
        date.getDate() === parseInt(day)
      )
    }

    if (id) {
      addCondition('id', id)
    } else if (passport_number) {
      addCondition('passport_number', passport_number)
    } else {
      addCondition('passport_name', name)
      addCondition('visa_type', visa_type)

      if (nationality && nationality !== 'All') {
        addCondition('nationality', nationality)
      }

      if (commitDateFrom) {
        const dateStr = parseAndValidateDate(commitDateFrom)
        if (dateStr) {
          conditions.push(`DATE(commit_date) >= $${paramCount}`)
          values.push(dateStr)
          paramCount++
        }
      }

      if (commitDateTo) {
        const dateStr = parseAndValidateDate(commitDateTo)
        if (dateStr) {
          conditions.push(`DATE(commit_date) <= $${paramCount}`)
          values.push(dateStr)
          paramCount++
        }
      }

      if (
        mkf_status !== undefined &&
        mkf_status !== null &&
        mkf_status !== '' &&
        !isNaN(Number(mkf_status))
      ) {
        conditions.push(`mkf_status = $${paramCount}`)
        values.push(Number(mkf_status))
        paramCount++
      }
    }
    
    if (search_type == 1) {
      query = `
        SELECT 
        id, nationality, passport_name, visa_type, passport_number, sim_price, 
        deposit_amount, balance, loan_pre_priority, entry_date, tel_number_kor,
        NULL AS deposit_sum
        FROM ${table}
        ${
          conditions.length > 0
            ? 'WHERE ' + conditions.join(' AND ') + ' AND balance = 0'
            : 'WHERE balance = 0'
        }
        UNION ALL
        SELECT 
          NULL AS id,
          NULL AS nationality,
          NULL AS passport_name,
          NULL AS visa_type,
          NULL AS passport_number,
          NULL AS sim_price,
          NULL AS deposit_amount,
          NULL AS balance,
          NULL AS loan_pre_priority,
          NULL AS entry_date,
          NULL AS tel_number_kor,
          SUM(deposit_amount) AS deposit_sum
        FROM ${table}
        ${
          conditions.length > 0
            ? 'WHERE ' + conditions.join(' AND ') + ' AND balance = 0'
            : 'WHERE balance = 0'
        }
        ORDER BY id DESC
      `
    } else if (search_type == 2) {
      query = `
    SELECT id, nationality, passport_name, visa_type, passport_number, phone_type, 
    sim_price, deposit_amount, balance, loan_pre_priority, entry_date, tel_number_kor
    FROM ${table}
    ${
      conditions.length > 0
        ? 'WHERE ' + conditions.join(' AND ') + ' AND balance != 0'
        : 'WHERE balance != 0'
    }
    ORDER BY id DESC
  `
    } else if (search_type == 3) {
      query = `
    SELECT id, nationality, passport_name, visa_type, passport_number, phone_type, 
    sim_price, deposit_amount, balance, loan_pre_priority, entry_date, tel_number_kor
    FROM ${table}
    ${
      conditions.length > 0
        ? 'WHERE ' + conditions.join(' AND ') + " AND visa_type = 'E9'"
        : "WHERE visa_type = 'E9'"
    }
    ORDER BY id DESC
  `
    } else if (search_type == 0) {
      query = `
    SELECT id, nationality, passport_name, visa_type, passport_number, phone_type, 
    sim_price, deposit_amount, balance, loan_pre_priority, entry_date, tel_number_kor
    FROM ${table}
    ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
    ORDER BY id DESC
  `
    }
    
    if (conditions.length === 0) {
      values = []
    }
    if (!query.includes('$1')) {
      values = []
    }

    console.log('서버의 query:', query, 'with values:', values) 
    const result = await pool.query(query, values)
    console.log(`Found ${result.rows.length} records`) 
    res.json(result.rows)
  } catch (err) {
    console.error('Error in /api/records:', err)
    res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
})

// ID로 업데이트
app.put('/api/records/id/:id', async (req, res) => {
  console.log(
    'Received request for app.put(/api/records/id:id with query:',
    req.query
  )
  const { jobGubun } = req.query
  const table = jobGubun === 'E' ? 'error_table' : 'mkf_master'
  try {
    const { id } = req.params
    const updateData = req.body
    
    ;[
      'commit_date',
      'sent_date',
      'completion_date',
      'entry_date',
      'deposit_date',
      'opening_date'
    ].forEach(key => {
      if (updateData[key]) {
        updateData[key] = updateData[key].split('.')[0]
        updateData[key] = updateData[key]
          .replace(/[^0-9-: ]/g, '')
          .split('.')[0]
        if (updateData[key].includes(':') && !updateData[key].includes(' ')) {
          updateData[key] = updateData[key].replace(
            /(\d{4}-\d{2}-\d{2})(\d{2}:\d{2}:\d{2})/,
            '$1 $2'
          )
        }
        const isValidDate = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(
          updateData[key]
        )
        if (!isValidDate) {
          console.error(
            `Invalid date format for field ${key}: ${updateData[key]}`
          )
          updateData[key] = null
        }
      }
    })

    delete updateData.id;
    if (!updateData.visa_type) updateData.visa_type = 'E8';
    if (updateData.phone_type === undefined || updateData.phone_type === null) updateData.phone_type = 0;
    else updateData.phone_type = Number(updateData.phone_type);
    if (updateData.loan_pre_priority === undefined || updateData.loan_pre_priority === null) updateData.loan_pre_priority = 0;
    if (updateData.loan_pre_priority !== undefined) updateData.loan_pre_priority = Number(updateData.loan_pre_priority);
    if (!updateData.tel_number_cam) updateData.tel_number_cam = null;
    if (!updateData.tel_number_kor) updateData.tel_number_kor = null;
    if (updateData.mkf_status === undefined || updateData.mkf_status === null) updateData.mkf_status = 0;
    else updateData.mkf_status = Number(updateData.mkf_status);
    
    const setClause = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ')
    const values = Object.values(updateData)
    const query = `
      UPDATE ${table}
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `
    const result = await pool.query(query, [id, ...values])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '데이터를 찾을 수 없습니다.' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error('Error in updating record:', err)
    res.status(500).json({ error: err.message || '서버 오류가 발생했습니다.' })
  }
})

// passport_number로 업데이트
app.put('/api/records/passport/:passport_number', async (req, res) => {
  const { jobGubun } = req.query
  const table = jobGubun === 'E' ? 'error_table' : 'mkf_master'
  try {
    const { passport_number } = req.params
    const updateData = req.body
    
    ;[
      'commit_date',
      'sent_date',
      'completion_date',
      'entry_date',
      'deposit_date',
      'opening_date'
    ].forEach(key => {
      if (updateData[key] === '' || updateData[key] === undefined) {
        updateData[key] = null
      }
    })
    
    delete updateData.passport_number

    const setClause = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ')
    const values = Object.values(updateData)
    const query = `
      UPDATE ${table}
      SET ${setClause}
      WHERE passport_number = $1
      RETURNING *
    `

    const result = await pool.query(query, [passport_number, ...values])

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: '업데이트할 데이터를 찾을 수 없습니다.' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error('Error in updating record by passport_number:', err)
    res.status(500).json({ error: err.message || '서버 오류가 발생했습니다.' })
  }
})

app.post('/api/download/all', async (req, res) => {
  const jobGubun = req.body.jobGubun || 'M'
  const keys = req.body.keys || []
  if (!Array.isArray(keys) || keys.length === 0) return res.json([])
  let sql, result
  if (jobGubun === 'E') {
    sql = `SELECT * FROM error_table WHERE passport_number = ANY($1)`
    result = await pool.query(sql, [keys])
  } else {
    sql = `SELECT * FROM mkf_master WHERE id = ANY($1::int[])`
    result = await pool.query(sql, [keys.map(Number)])
  }
  res.json(result.rows)
})

app.get('/api/error-data', async (req, res) => {
  const {
    commit_date,
    nationality,
    error_code,
    passport_number,
    passport_name
  } = req.query
  
  let sql = 'SELECT * FROM error_table WHERE 1=1'
  const params = []
  if (commit_date && commit_date.trim() !== '') {
    sql += ' AND commit_date::date = $' + (params.length + 1)
    params.push(commit_date)
  }
  if (nationality && nationality !== 'All') {
    sql += ' AND nationality = $' + (params.length + 1)
    params.push(nationality)
  }
  if (error_code) {
    sql += ' AND error_code = $' + (params.length + 1)
    params.push(error_code)
  }
  if (passport_number) {
    sql += ' AND passport_number = $' + (params.length + 1)
    params.push(passport_number)
  }
  if (passport_name) {
    sql += ' AND passport_name = $' + (params.length + 1)
    params.push(passport_name)
  }
  sql += ' ORDER BY commit_date DESC'

  try {
    const result = await pool.query(sql, params)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/members-data', async (req, res) => {
  const { commit_date, passport_name, nationality } = req.query
  
  let sql = 'SELECT * FROM new_members WHERE 1=1'
  const params = []
  if (commit_date && commit_date.trim() !== '') {
    sql += ' AND commit_date::date = $' + (params.length + 1)
    params.push(commit_date)
  }
  if (nationality && nationality !== 'All') {
    sql += ' AND nationality = $' + (params.length + 1)
    params.push(nationality)
  }
  if (passport_name) {
    sql += ' AND passport_name = $' + (params.length + 1)
    params.push(passport_name)
  }
  sql += ' ORDER BY id DESC'

  try {
    const result = await pool.query(sql, params)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/records', async (req, res) => {
  const { jobGubun } = req.query
  const table = jobGubun === 'E' ? 'error_table' : 'mkf_master'

  try {
    const data = req.body

    const keys = Object.keys(data).filter(
      k => data[k] !== null && data[k] !== undefined && data[k] !== ''
    )
    if (keys.length === 0) {
      return res.status(400).json({ error: '입력 데이터가 없습니다.' })
    }

    const columns = keys.map(k => `"${k}"`).join(', ')
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
    const values = keys.map(k => data[k])

    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING id`
    
    const { rows } = await pool.query(sql, values)

    res.status(200).json({ success: true, insertId: rows[0]?.id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'DB 저장 중 오류 발생' })
  }
})
app.post('/execute-query', async (req, res) => {
  const { queries } = req.body 
  let errorCount = 0
  let errorList = []
  const results = []
  
  for (const query of queries) {
    try {
      await pool.query(query)
      results.push({ status: 'success' })
    } catch (err) {
      results.push({ status: 'fail', error: err.message })
      errorCount++
    }
  }
  
  const [mkfResult, errorResult] = await Promise.all([
    pool.query(
      'SELECT COUNT(*) FROM mkf_master WHERE commit_date::date = CURRENT_DATE'
    ),
    pool.query(
      'SELECT COUNT(*) FROM error_table WHERE commit_date::date = CURRENT_DATE'
    )
  ])
  const mkfCount = mkfResult.rows[0].count
  const errorTableCount = errorResult.rows[0].count
  if (errorCount > 0) {
    res.status(207).json({
      result: 'partial_fail',
      error_count: errorCount,
      errors: errorList,
      mkf_master_count: mkfCount,
      error_table_count: errorTableCount,
      results
    })
  } else {
    res.json({
      result: 'success',
      error_count: 0,
      mkf_master_count: mkfCount,
      error_table_count: errorTableCount,
      results
    })
  }
})

app.post('/api/records/update-opening', async (req, res) => {
  let successCount = 0
  let errorTableCount = 0

  try {
    const { passport_name, passport_number, tel_number_kor } = req.body

    let query = `
      SELECT update_master_opening_enhanced ($1, $2, $3);      
    `
    let result = await pool.query(query, [
      passport_name,
      passport_number,
      tel_number_kor
    ])
    
    if (result.rows.length > 0) {
      successCount++
    } else {
      errorTableCount++
    }

    res.json({
      success: true,
      message: '처리가 완료되었습니다.',
      statistics: {
        successCount,
        errorTableCount
      }
    })
  } catch (err) {
    console.error('Error in /api/records/update-opening:', err)
    res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
})

app.post('/api/new-members', async (req, res) => {
  const data = req.body;
  try {
    const query = `
      SELECT update_new_members(
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) AS id
    `;
    function emptyToNull(value) {
      return value === '' ? null : value;
    }
    const values = [
      data.p_id,
      data.p_commit_date,
      data.p_field_update,
      data.p_passport_name,
      data.p_gender,
      data.p_date_of_birth,
      data.p_tel_number,
      data.p_signyn,
      data.p_passport_number,
      data.p_nationality,
      data.p_error_code,
      data.p_error_message,
      emptyToNull(data.p_entry_date)
    ];
    const result = await pool.query(query, values);
    res.json({ id: result.rows[0].id });
  } catch (err) {
    console.error('Error in /api/new-members:', err);
    res.status(500).json({ error: err.message });
  }
});

// 에러 핸들링 미들웨어 추가
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: '서버 오류가 발생했습니다.' })
})

// uploads 폴더의 파일 목록 조회 API
app.get('/api/list-files', (req, res) => {
  try {
    const uploadDir = path.join(__dirname, 'uploads');
    
    // uploads 폴더가 존재하지 않으면 생성
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      return res.json([]);
    }
    
    // 폴더 내 파일 목록 읽기
    const files = fs.readdirSync(uploadDir)
      .filter(file => {
        // 숨김 파일 제외하고 실제 파일만 포함
        const filePath = path.join(uploadDir, file);
        const stat = fs.statSync(filePath);
        return stat.isFile() && !file.startsWith('.');
      })
      .sort((a, b) => {
        // 파일명으로 정렬
        return a.toLowerCase().localeCompare(b.toLowerCase());
      });
    
    console.log(`Found ${files.length} files in uploads folder:`, files);
    res.json(files);
    
  } catch (error) {
    console.error('파일 목록 조회 중 오류:', error);
    res.status(500).json({ 
      error: '파일 목록을 가져오는 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

// 이미지 파일 업로드 API
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: '파일이 업로드되지 않았습니다.' 
      });
    }

    console.log('이미지 파일 업로드 성공:', req.file.filename);
    
    res.json({
      success: true,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: `/uploads/${req.file.filename}`
    });
    
  } catch (error) {
    console.error('이미지 업로드 중 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: '파일 업로드 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

app.listen(port, host, () => {
  console.log(`서버가 http://${host}:${port} 에서 실행 중입니다.`)
  console.log('환경 설정:', {
    nodeEnv: process.env.NODE_ENV,
    dbHost: process.env.DB_HOST,
    dbName: process.env.DB_NAME,
    dbPort: process.env.DB_PORT
  })
})
