// Excel 파일 처리 기능
let selectedInputFile = null;
let selectedOutputFile = null;

document.addEventListener('DOMContentLoaded', function() {
    const imageToExcelButton = document.getElementById('imageToExcelButton');
    const selectInputButton = document.getElementById('selectInputButton');
    const selectOutputButton = document.getElementById('selectOutputButton');
    const processExcelButton = document.getElementById('processExcelButton');
    const cancelExcelButton = document.getElementById('cancelExcelButton');
    const inputFileInput = document.getElementById('inputFileInput');
    const outputFileInput = document.getElementById('outputFileInput');
    const inputPath = document.getElementById('inputPath');
    const outputPath = document.getElementById('outputPath');
    const excelProcessingUI = document.getElementById('excelProcessingUI');
    
    // Image to Excel 버튼 클릭 시 UI 표시
    if (imageToExcelButton) {
        imageToExcelButton.addEventListener('click', function() {
            excelProcessingUI.style.display = 'flex';
            resetForm();
        });
    }
    
    // 입력 파일 선택 버튼
    if (selectInputButton) {
        selectInputButton.addEventListener('click', function() {
            inputFileInput.click();
        });
    }
    
    // 출력 파일 선택 버튼
    if (selectOutputButton) {
        selectOutputButton.addEventListener('click', function() {
            outputFileInput.click();
        });
    }
    
    // 입력 파일 선택 이벤트
    if (inputFileInput) {
        inputFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                selectedInputFile = file;
                inputPath.value = file.name;
                updateProcessButton();
            }
        });
    }
    
    // 출력 파일 선택 이벤트
    if (outputFileInput) {
        outputFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                selectedOutputFile = file;
                outputPath.value = file.name;
                updateProcessButton();
            }
        });
    }
    
    // 출력 파일명 직접 입력 이벤트
    if (outputPath) {
        outputPath.addEventListener('input', function(e) {
            const fileName = e.target.value.trim();
            if (fileName) {
                // 파일명이 입력되면 selectedOutputFile을 null로 설정 (새 파일 생성)
                selectedOutputFile = null;
                updateProcessButton();
            }
        });
    }
    
    // 확인 버튼
    if (processExcelButton) {
        processExcelButton.addEventListener('click', function() {
            // 버튼이 비활성화되어 있으면 이벤트 무시
            if (this.disabled) {
                return;
            }
            
            const inputPath = document.getElementById('inputPath');
            const outputPath = document.getElementById('outputPath');
            
            // 입력 검증
            if (!selectedInputFile) {
                alert('입력 파일을 선택해주세요.');
                return;
            }
            
            if (!outputPath.value.trim() && !selectedOutputFile) {
                alert('출력 파일명을 입력하거나 파일을 선택해주세요.');
                return;
            }
            
            // 파일 처리 실행
            processExcelFiles(selectedInputFile, selectedOutputFile, outputPath.value.trim());
        });
    }
    
    // 취소 버튼
    if (cancelExcelButton) {
        cancelExcelButton.addEventListener('click', function() {
            closeModal();
        });
    }
    
    // 모달 외부 클릭 시 닫기
    if (excelProcessingUI) {
        excelProcessingUI.addEventListener('click', function(e) {
            if (e.target === excelProcessingUI) {
                closeModal();
            }
        });
    }
});

function resetForm() {
    selectedInputFile = null;
    selectedOutputFile = null;
    inputPath.value = '';
    outputPath.value = '';
    updateProcessButton();
}

function closeModal() {
    const excelProcessingUI = document.getElementById('excelProcessingUI');
    excelProcessingUI.style.display = 'none';
    resetForm();
}

function updateProcessButton() {
    const processExcelButton = document.getElementById('processExcelButton');
    const inputPath = document.getElementById('inputPath');
    const outputPath = document.getElementById('outputPath');
    
    if (selectedInputFile && (selectedOutputFile || outputPath.value.trim())) {
        processExcelButton.disabled = false;
        processExcelButton.textContent = '확인';
    } else {
        processExcelButton.disabled = true;
        processExcelButton.textContent = '파일을 모두 선택해주세요';
    }
}

function processExcelFiles(inputFile, outputFile, outputFileName) {
    const reader1 = new FileReader();
    
    reader1.onload = function(e) {
        try {
            const inputData = new Uint8Array(e.target.result);
            const inputWorkbook = XLSX.read(inputData, { type: 'array' });
            
            // 데이터 처리
            const processedData = processInputData(inputWorkbook);
            
            if (outputFile) {
                // 기존 파일을 선택한 경우
                const reader2 = new FileReader();
                reader2.onload = function(e2) {
                    try {
                        const outputData = new Uint8Array(e2.target.result);
                        const outputWorkbook = XLSX.read(outputData, { type: 'array' });
                        const finalWorkbook = createOutputWorkbook(processedData, outputWorkbook);
                        
                        // 선택한 파일명으로 저장
                        XLSX.writeFile(finalWorkbook, outputFile.name);
                        alert(`데이터 처리가 완료되었습니다.`);
                        closeModal();
                    } catch (error) {
                        alert('출력 파일 처리 중 오류가 발생했습니다: ' + error.message);
                    }
                };
                reader2.onerror = function() {
                    alert('출력 파일을 읽는 중 오류가 발생했습니다.');
                };
                reader2.readAsArrayBuffer(outputFile);
            } else {
                // 새 파일명을 입력한 경우
                try {
                    // 빈 워크북 생성
                    const newWorkbook = XLSX.utils.book_new();
                    const newSheet = {};
                    
                    // 헤더 추가
                    const headers = [
                        { cell: 'A1', value: 'No' },
                        { cell: 'B1', value: 'Name' },
                        { cell: 'C1', value: 'Gender' },
                        { cell: 'D1', value: 'Date of Birth' }
                    ];
                    
                    headers.forEach(header => {
                        newSheet[header.cell] = { v: header.value, t: 's' };
                    });
                    
                    // 데이터 추가
                    processedData.forEach((record, index) => {
                        const rowNum = index + 2; // 헤더 다음 행부터 시작
                        
                        newSheet[`A${rowNum}`] = { v: record.No, t: 's' };
                        newSheet[`B${rowNum}`] = { v: record.Name, t: 's' };
                        newSheet[`C${rowNum}`] = { v: record.Gender, t: 's' };
                        newSheet[`D${rowNum}`] = { v: record.DateOfBirth, t: 's' };
                    });
                    
                    // 범위 업데이트
                    const maxRow = processedData.length + 1;
                    newSheet['!ref'] = `A1:D${maxRow}`;
                    
                    // 워크북에 시트 추가
                    XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Sheet1');
                    
                    // 입력한 파일명으로 저장 (확장자 추가)
                    const finalFileName = outputFileName.endsWith('.xlsx') ? outputFileName : outputFileName + '.xlsx';
                    XLSX.writeFile(newWorkbook, finalFileName);
                    alert(`데이터 처리가 완료되었습니다.`);
                    closeModal();
                } catch (error) {
                    alert('새 파일 생성 중 오류가 발생했습니다: ' + error.message);
                }
            }
        } catch (error) {
            alert('입력 파일 처리 중 오류가 발생했습니다: ' + error.message);
        }
    };
    
    reader1.onerror = function() {
        alert('입력 파일을 읽는 중 오류가 발생했습니다.');
    };
    
    reader1.readAsArrayBuffer(inputFile);
}

function processInputData(inputWorkbook) {
    const inputSheet = inputWorkbook.Sheets[inputWorkbook.SheetNames[0]];
    const inputRange = XLSX.utils.decode_range(inputSheet['!ref']);
    
    const processedData = [];
    let currentRecord = {};
    let rowIndex = inputRange.s.r; // 시작 행
    
    // A열만 읽기 (0번째 열)
    while (rowIndex <= inputRange.e.r) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
        const cell = inputSheet[cellAddress];
        
        if (!cell) {
            rowIndex++;
            continue;
        }
        
        const cellValue = cell.v;
        
        // 빈 셀이거나 스페이스만 있는 경우 스킵
        if (!cellValue || (typeof cellValue === 'string' && cellValue.trim() === '')) {
            rowIndex++;
            continue;
        }
        
        // 영어, 숫자, 날짜가 아닌 경우 스킵
        if (typeof cellValue === 'string' && !isValidContent(cellValue)) {
            rowIndex++;
            continue;
        }
        
        // 순수한 숫자인 경우 - No
        if (typeof cellValue === 'number' || (typeof cellValue === 'string' && /^\d+$/.test(cellValue))) {
            // 이전 레코드가 완성되면 저장
            if (currentRecord.No && currentRecord.Name && currentRecord.Gender && currentRecord.DateOfBirth) {
                processedData.push({...currentRecord});
            }
            
            // 새 레코드 시작
            currentRecord = {
                No: typeof cellValue === 'number' ? cellValue.toString() : cellValue,
                Name: '',
                Gender: '',
                DateOfBirth: ''
            };
            rowIndex++;
            continue;
        }
        
        // 이름 패턴 확인 ('성' + space + '이름' + space)
        if (typeof cellValue === 'string' && isNamePattern(cellValue)) {
            currentRecord.Name = cellValue.trim();
            rowIndex++;
            continue;
        }
        
        // 성별 확인 (F 또는 M)
        if (typeof cellValue === 'string' && /^[FM]$/i.test(cellValue.trim())) {
            currentRecord.Gender = cellValue.trim().toUpperCase();
            rowIndex++;
            continue;
        }
        
        // 날짜 패턴 확인 (YYYY-MM-DD)
        if (typeof cellValue === 'string' && isDatePattern(cellValue)) {
            currentRecord.DateOfBirth = cellValue.trim();
            rowIndex++;
            continue;
        }
        
        // 날짜 객체인 경우
        if (cellValue instanceof Date) {
            currentRecord.DateOfBirth = formatDate(cellValue);
            rowIndex++;
            continue;
        }
        
        rowIndex++;
    }
    
    // 마지막 레코드 처리
    if (currentRecord.No && currentRecord.Name && currentRecord.Gender && currentRecord.DateOfBirth) {
        processedData.push(currentRecord);
    }
    
    return processedData;
}

function createOutputWorkbook(processedData, outputWorkbook) {
    // 출력 워크북의 첫 번째 시트 사용
    const outputSheetName = outputWorkbook.SheetNames[0];
    const outputSheet = outputWorkbook.Sheets[outputSheetName];
    
    // 헤더 추가
    const headers = [
        { cell: 'A1', value: 'No' },
        { cell: 'B1', value: 'Name' },
        { cell: 'C1', value: 'Gender' },
        { cell: 'D1', value: 'Date of Birth' }
    ];
    
    headers.forEach(header => {
        outputSheet[header.cell] = { v: header.value, t: 's' };
    });
    
    // 데이터 추가
    processedData.forEach((record, index) => {
        const rowNum = index + 2; // 헤더 다음 행부터 시작
        
        outputSheet[`A${rowNum}`] = { v: record.No, t: 's' };
        outputSheet[`B${rowNum}`] = { v: record.Name, t: 's' };
        outputSheet[`C${rowNum}`] = { v: record.Gender, t: 's' };
        outputSheet[`D${rowNum}`] = { v: record.DateOfBirth, t: 's' };
    });
    
    // 범위 업데이트
    const maxRow = processedData.length + 1;
    outputSheet['!ref'] = `A1:D${maxRow}`;
    
    return outputWorkbook;
}

// 유틸리티 함수들
function isValidContent(value) {
    // 영어, 숫자, 날짜, 공백만 허용
    return /^[a-zA-Z0-9\s\-\.\/]+$/.test(value) || value instanceof Date;
}

function isNamePattern(value) {
    // '성' + space + '이름' + space 패턴 확인
    const trimmed = value.trim();
    const parts = trimmed.split(/\s+/);
    
    if (parts.length >= 2) {
        // 첫 번째 부분은 한글(성), 두 번째 부분은 영어(이름)
        const lastName = parts[0];
        const firstName = parts[1];
        
        return /^[가-힣]+$/.test(lastName) && /^[a-zA-Z]+$/.test(firstName);
    }
    
    return false;
}

function isDatePattern(value) {
    // YYYY-MM-DD 패턴 확인
    return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
