// File Selection Event
document
  .getElementById('newMembersFileInput')
  .addEventListener('change', async event => {
    const file = event.target.files[0]
    if (!file) {
      alert('파일이 선택되지 않았습니다.')
      return
    }
    alert('파일이 선택되었습니다. 처리 중입니다...')
    try {
      const reader = new FileReader()
      reader.onload = async e => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]
          const rows = XLSX.utils.sheet_to_json(sheet)
          let queries = []
          for (const row of rows) {
            const dateOfBirth = excelSerialDateToISO(row['Date of Birth'])
            const query = `select * from insert_into_new_members('${row['No']}', '${row['Name']}', '${row['Gender']}', '${dateOfBirth}');`
            queries.push(query)
          }
          await newExecuteQueries(queries)
        } catch (error) {
          console.error('파일 처리 중 오류:', error)
          alert('파일 처리 중 오류가 발생했습니다.')
        }
      }
      reader.onerror = error => {
        console.error('FileReader 오류:', error)
        alert('파일을 읽는 중 오류가 발생했습니다.')
      }
      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('파일 처리 중 오류:', error)
      alert('파일 처리 중 오류가 발생했습니다.')
    }
  })

function excelSerialDateToISO (serial) {
  // 엑셀 날짜가 문자열(YYYY-MM-DD)로 이미 들어온 경우 그대로 반환
  if (typeof serial === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(serial)) {
    return serial
  }
  // 엑셀 시리얼 날짜(숫자)를 JS 날짜로 변환
  const excelEpoch = new Date(Date.UTC(1899, 11, 30))
  excelEpoch.setUTCDate(excelEpoch.getUTCDate() + Number(serial))
  return excelEpoch.toISOString().slice(0, 10) // 'YYYY-MM-DD'
}
// 반드시 호출 전에 정의되어 있어야 함
function showResultModal2 (result) {
  alert(
    `처리 결과:\n` +
      `총건수: ${result.total}건\n` +
      `성공: ${result.success}건\n` +
      `실패: ${result.fail}건\n`
  )
}

// 서버로 쿼리 실행
async function newExecuteQueries (queries) {
  try {
    const response = await fetch('/execute-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries })
    })

    // 여기에 결과를 한 번만 선언하고 할당합니다.
    const results = await response.json()
    console.log('results:', results)
    // results.results가 실제 배열입니다.
    let arr = results.results

    let successCount = arr.filter(r => r.status === 'success').length
    let failCount = arr.length - successCount

    showResultModal2({
      total: arr.length,
      success: successCount,
      fail: failCount,
      details: arr
    })
  } catch (error) {
    console.error('Error executing queries:', error)
    alert('서버와의 통신 중 오류가 발생했습니다.')
  }
}
