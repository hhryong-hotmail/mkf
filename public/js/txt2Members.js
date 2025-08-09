// txt2Members.js - TXT 파일을 읽어서 Members 데이터로 변환

// 메인 함수 - 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    // Text to Members 버튼에 이벤트 리스너 추가
    const txt2MembersButton = document.getElementById('txt2MembersButton');
    if (txt2MembersButton) {
        txt2MembersButton.addEventListener('click', startTxtProcessing);
    }
    
    // 숨겨진 파일 입력 요소 생성
    createHiddenFileInput();
});

// 숨겨진 파일 입력 요소 생성
function createHiddenFileInput() {
    // 기존 요소가 있다면 제거
    const existingInput = document.getElementById('txtFileInput');
    if (existingInput) {
        existingInput.remove();
    }
    
    // 새로운 파일 입력 요소 생성
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'txtFileInput';
    fileInput.accept = '.txt';
    fileInput.multiple = true; // 여러 파일 선택 가능
    fileInput.style.display = 'none';
    
    // 파일 선택 이벤트 리스너 추가
    fileInput.addEventListener('change', handleTxtFileSelection);
    
    document.body.appendChild(fileInput);
}

// TXT 처리 시작
function startTxtProcessing() {
    const fileInput = document.getElementById('txtFileInput');
    if (fileInput) {
        fileInput.click(); // 파일 선택 대화 상자 열기
    } else {
        console.error('파일 입력 요소를 찾을 수 없습니다.');
        alert('파일 선택 기능을 초기화할 수 없습니다.');
    }
}

// TXT 파일 선택 처리
function handleTxtFileSelection(event) {
    const files = event.target.files;
    if (!files || files.length === 0) {
        alert('파일이 선택되지 않았습니다.');
        return;
    }
    
    console.log(`=== TXT 파일 처리 시작 ===`);
    console.log(`선택된 파일 수: ${files.length}`);
    
    // 각 파일을 순차적으로 처리
    processTxtFiles(files);
}

// newMembers.js의 newExecuteQueries 함수 복사 (존재하지 않으면 아래 코드가 동작하도록 추가)
async function newExecuteQueries(queries) {
  try {
    const response = await fetch('/execute-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries })
    })
    const results = await response.json()
    let arr = results.results
    let successCount = arr.filter(r => r.status === 'success').length
    let failCount = arr.length - successCount
    alert(
      `처리 결과:\n` +
        `총건수: ${arr.length}건\n` +
        `성공: ${successCount}건\n` +
        `실패: ${failCount}건\n`
    )
  } catch (error) {
    console.error('Error executing queries:', error)
    alert('서버와의 통신 중 오류가 발생했습니다.')
  }
}

// TXT 파일들을 순차적으로 처리
async function processTxtFiles(files) {
    let queries = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.name.toLowerCase().endsWith('.txt')) continue;
        try {
            const content = await readTxtFile(file);
            const lines = content.split('\n').map(line => line.trim()).filter(line => line);
            let idx = 0;
            while (idx < lines.length) {
                // 빈 라인이나 크메르어/기타 언어 헤더는 건너뛰기
                if (!lines[idx] || lines[idx].trim() === '') {
                    idx++;
                }
                
                // 크메르어나 기타 비ASCII 문자가 포함된 라인 건너뛰기
                else if (/[^\x00-\x7F]/.test(lines[idx])) {
                    //console.log("크메르어/기타 언어 라인 건너뛰기:", lines[idx]);
                    idx++;
                }
                
                // 1. No: 순수 숫자이고 길이가 8 미만인 경우 먼저 찾기
                else if (/^[0-9]+$/.test(lines[idx]) && lines[idx].length < 8) {
                    const no = lines[idx];
                    idx++;
                    console.log("-----------------------------------")
                    console.log("no=", no);

                    let name = '';
                    // no 다음 줄부터 name 조건을 만족하는 줄을 찾을 때까지 반복
                    while (idx < lines.length) {
                        const nameCandidate = lines[idx].replace(/\s+/g, ' ').trim();
                        if (nameCandidate === '' || /[^A-Za-z .\-]/.test(nameCandidate)) {
                            // 빈 줄, 이상한 문자, 조건 불일치 시 skip
                            //console.log("이름 조건 불일치:", lines[idx]);
                            idx++;
                        } else if (/^[A-Za-z .\-]+$/.test(nameCandidate)) {
                            name = nameCandidate;
                            console.log("name=", name);
                            idx++;
                            break;
                        } else {
                            idx++;
                        }
                    }
                    // no, name 모두 set된 경우에만 쿼리 push
                    if (no && name) {
                        let gender = '';
                        if (idx < lines.length && /^[MF]$/.test(lines[idx])) {
                            gender = lines[idx];
                            idx++;
                        }
                        console.log("gender=", gender);
                        let birth = '';
                        if (idx < lines.length && /^\d{4}-\d{2}-\d{2}$/.test(lines[idx])) {
                            birth = lines[idx];
                            idx++;
                        }
                        console.log("birth=", birth);
                        const birthValue = birth ? `'${birth}'::date` : 'null';
                        queries.push(`select * from insert_into_new_members('${no}'::text,'${name}'::text,'${gender}'::text,${birthValue});`);
                        console.log(`no=${no}, name=${name}, gender=${gender}, birth=${birth}`);
                    } else {
                        console.log("no=" + no + " - 이름이 없어서 건너뜀");
                    }
                } else {
                    // 조건에 맞지 않는 라인은 건너뛰기
                    idx++;
                }
            }
        } catch (error) {
            alert(`파일 "${file.name}" 처리 중 오류: ${error.message}`);
        }
    }
    if (queries.length > 0) {
        await newExecuteQueries(queries);
    } else {
        alert('추출된 데이터가 없습니다.');
    }
}

// TXT 파일 읽기 함수
function readTxtFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                resolve(content);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function(error) {
            reject(error);
        };
        
        // 파일을 텍스트로 읽기
        reader.readAsText(file, 'UTF-8');
    });
}

// 전역 함수로 노출 (콘솔에서 테스트 가능)
window.txt2Members = {
    startTxtProcessing,
    processTxtFiles,
    readTxtFile
};

