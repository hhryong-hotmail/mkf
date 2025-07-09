// imageToExcel.js - JPG 파일에서 텍스트 추출 및 처리

// Tesseract.js를 사용하여 OCR 기능 구현
// CDN에서 로드: <script src="https://cdn.jsdelivr.net/npm/tesseract.js@2.1.5/dist/tesseract.min.js"></script>

let totalCount = 0;
let extractedData = [];

// 메인 함수 - 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    // Image to Excel 버튼에 이벤트 리스너 추가
    const imageToExcelButton = document.getElementById('imageToExcelButton');
    if (imageToExcelButton) {
        imageToExcelButton.addEventListener('click', startImageProcessing);
    }
    
    // 숨겨진 파일 입력 요소 생성
    createHiddenFileInput();
});

// 숨겨진 파일 입력 요소 생성
function createHiddenFileInput() {
    // 기존 요소가 있다면 제거
    const existingInput = document.getElementById('imageFileInput');
    if (existingInput) {
        existingInput.remove();
    }
    
    // 새로운 파일 입력 요소 생성
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'imageFileInput';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    // 파일 선택 이벤트 리스너 추가
    fileInput.addEventListener('change', handleImageFileSelection);
    
    document.body.appendChild(fileInput);
}

// 이미지 처리 시작
function startImageProcessing() {
    const fileInput = document.getElementById('imageFileInput');
    if (fileInput) {
        fileInput.click(); // 파일 선택 대화 상자 열기
    } else {
        console.error('파일 입력 요소를 찾을 수 없습니다.');
        alert('파일 선택 기능을 초기화할 수 없습니다.');
    }
}

// 이미지 파일 선택 처리
function handleImageFileSelection(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('파일이 선택되지 않았습니다.');
        return;
    }
    
    // 이미지 파일 검증
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 선택할 수 있습니다.');
        return;
    }
    
    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('파일 크기는 10MB 이하여야 합니다.');
        return;
    }
    
    alert('파일이 선택되었습니다. 처리 중입니다...');
    
    // 파일을 서버에 업로드
    uploadImageFile(file);
}

// 서버에 이미지 파일 업로드
function uploadImageFile(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    fetch('/api/upload-image', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 업로드된 파일로 OCR 처리 시작
            processSelectedFile(data.filename);
        } else {
            throw new Error(data.error || '업로드 실패');
        }
    })
    .catch(error => {
        console.error('파일 업로드 실패:', error);
        alert('파일 업로드 중 오류가 발생했습니다: ' + error.message);
    });
}

// 선택된 파일 처리
function processSelectedFile(fileName) {
    // 파일 경로 설정 (uploads 폴더에서 찾기)
    const imagePath = `/uploads/${fileName}`;
    
    // 이미지 존재 여부 확인
    const img = new Image();
    img.onload = function() {
        processImageWithOCR(imagePath);
    };
    img.onerror = function() {
        alert("이미지 파일을 찾을 수 없습니다: " + fileName);
    };
    img.src = imagePath;
}

// OCR을 사용하여 이미지에서 텍스트 추출
function processImageWithOCR(imagePath) {
    // 로딩 UI 표시
    showLoadingDialog("이미지에서 텍스트를 추출하고 있습니다...", 0);
    
    // 이미지 전처리 및 OCR 실행
    preprocessAndRecognize(imagePath);
}

// 이미지 전처리 및 OCR 실행
async function preprocessAndRecognize(imagePath) {
    try {
        // 이미지 전처리 수행
        updateLoadingProgress("이미지 전처리 중...", 5);
        const preprocessedImage = await preprocessImage(imagePath);
        
        // 1단계: 기본 OCR 시도 (영어)
        updateLoadingProgress("1단계: 기본 텍스트 인식 중...", 10);
        const basicResult = await Tesseract.recognize(
            preprocessedImage,
            'eng',
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const progress = 10 + Math.round(m.progress * 15);
                        updateLoadingProgress(`기본 인식 중... ${Math.round(m.progress * 100)}%`, progress);
                    }
                }
            }
        );
        
        // 2단계: PSM AUTO 모드
        updateLoadingProgress("2단계: 자동 레이아웃 분석 중...", 30);
        const autoResult = await Tesseract.recognize(
            preprocessedImage,
            'eng',
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const progress = 30 + Math.round(m.progress * 15);
                        updateLoadingProgress(`자동 레이아웃 분석 중... ${Math.round(m.progress * 100)}%`, progress);
                    }
                },
                tessedit_pageseg_mode: Tesseract.PSM.AUTO
            }
        );
        
        // 3단계: PSM SINGLE_BLOCK 모드
        updateLoadingProgress("3단계: 단일 블록 분석 중...", 50);
        const singleBlockResult = await Tesseract.recognize(
            preprocessedImage,
            'eng',
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const progress = 50 + Math.round(m.progress * 15);
                        updateLoadingProgress(`단일 블록 분석 중... ${Math.round(m.progress * 100)}%`, progress);
                    }
                },
                tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK
            }
        );
        
        // 4단계: PSM SINGLE_COLUMN 모드
        updateLoadingProgress("4단계: 단일 컬럼 분석 중...", 70);
        const singleColumnResult = await Tesseract.recognize(
            preprocessedImage,
            'eng',
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const progress = 70 + Math.round(m.progress * 15);
                        updateLoadingProgress(`단일 컬럼 분석 중... ${Math.round(m.progress * 100)}%`, progress);
                    }
                },
                tessedit_pageseg_mode: Tesseract.PSM.SINGLE_COLUMN
            }
        );
        
        // 5단계: PSM SPARSE_TEXT 모드 (전체 이미지에서 텍스트 찾기)
        updateLoadingProgress("5단계: 전체 이미지 텍스트 검색 중...", 85);
        const sparseTextResult = await Tesseract.recognize(
            preprocessedImage,
            'eng',
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const progress = 85 + Math.round(m.progress * 10);
                        updateLoadingProgress(`전체 이미지 검색 중... ${Math.round(m.progress * 100)}%`, progress);
                    }
                },
                tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT
            }
        );
        
        // 6단계: 원본 이미지로 시도
        updateLoadingProgress("6단계: 원본 이미지 인식 중...", 95);
        const originalResult = await Tesseract.recognize(
            imagePath,
            'eng',
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const progress = 95 + Math.round(m.progress * 5);
                        updateLoadingProgress(`원본 이미지 인식 중... ${Math.round(m.progress * 100)}%`, progress);
                    }
                },
                tessedit_pageseg_mode: Tesseract.PSM.AUTO
            }
        );
        
        // 결과 비교 및 최적 결과 선택
        const results = [
            { text: basicResult.data.text, confidence: basicResult.data.confidence, name: '기본(전처리)' },
            { text: autoResult.data.text, confidence: autoResult.data.confidence, name: '자동(전처리)' },
            { text: singleBlockResult.data.text, confidence: singleBlockResult.data.confidence, name: '단일블록(전처리)' },
            { text: singleColumnResult.data.text, confidence: singleColumnResult.data.confidence, name: '단일컬럼(전처리)' },
            { text: sparseTextResult.data.text, confidence: sparseTextResult.data.confidence, name: '전체검색(전처리)' },
            { text: originalResult.data.text, confidence: originalResult.data.confidence, name: '원본' }
        ];
        
        // 가장 높은 신뢰도를 가진 결과 선택
        const bestResult = results.reduce((best, current) => 
            current.confidence > best.confidence ? current : best
        );
        
        // 텍스트 길이도 고려하여 선택 (신뢰도가 비슷한 경우)
        const longTextResult = results.reduce((best, current) => {
            if (current.confidence >= best.confidence * 0.85) { // 신뢰도가 85% 이상인 경우
                return current.text.length > best.text.length ? current : best;
            }
            return best;
        });
        
        // 최종 결과 선택 (신뢰도와 텍스트 길이 모두 고려)
        const finalResult = longTextResult.confidence > bestResult.confidence * 0.9 ? longTextResult : bestResult;
        
        hideLoadingDialog();
        console.log("추출된 텍스트 (최적 결과):", finalResult.text);
        console.log("신뢰도:", finalResult.confidence);
        console.log("선택된 방법:", finalResult.name);
        
        // 모든 결과를 콘솔에 출력 (디버깅용)
        console.log("=== 모든 OCR 결과 ===");
        results.forEach((result, index) => {
            console.log(`결과 ${index + 1} (${result.name}, 신뢰도: ${result.confidence}%, 길이: ${result.text.length}):`);
            console.log(result.text);
            console.log("---");
        });
        
        processExtractedText(finalResult.text);
        
    } catch (err) {
        hideLoadingDialog();
        console.error("OCR 처리 중 오류:", err);
        alert("텍스트 추출 중 오류가 발생했습니다.");
    }
}

// 이미지 전처리 함수
async function preprocessImage(imagePath) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 캔버스 크기 설정 (이미지 크기에 따라 조정)
            const maxWidth = 2000;
            const maxHeight = 2000;
            let { width, height } = img;
            
            // 이미지가 너무 크면 리사이즈
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // 이미지 그리기
            ctx.drawImage(img, 0, 0, width, height);
            
            // 이미지 데이터 가져오기
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            
            // 대비 개선 및 노이즈 제거
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // 그레이스케일 변환
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                
                // 이진화 (임계값 적용)
                const threshold = 128;
                const binary = gray > threshold ? 255 : 0;
                
                // 결과 적용
                data[i] = binary;     // R
                data[i + 1] = binary; // G
                data[i + 2] = binary; // B
                // Alpha는 그대로 유지
            }
            
            // 처리된 이미지 데이터를 캔버스에 다시 그리기
            ctx.putImageData(imageData, 0, 0);
            
            // 캔버스를 Blob으로 변환
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                resolve(url);
            }, 'image/png');
        };
        
        img.onerror = function() {
            // 전처리 실패 시 원본 이미지 반환
            console.warn('이미지 전처리 실패, 원본 이미지 사용');
            resolve(imagePath);
        };
        
        img.src = imagePath;
    });
}

// 추출된 텍스트 처리 (개선된 버전)
function processExtractedText(text) {
    const lines = text.split('\n');
    let foundNoName = false;
    let processedData = [];
    
    console.log("=== 텍스트 처리 시작 ===");
    console.log("전체 라인 수:", lines.length);
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 빈 줄 건너뛰기
        if (!line) continue;
        
        console.log(`라인 ${i + 1}: "${line}"`);
        
        // "No" 및 "Name"이 포함된 행 찾기 (더 유연한 검색)
        if (!foundNoName && (
            line.toLowerCase().includes('no') && line.toLowerCase().includes('name') ||
            line.toLowerCase().includes('name list') ||
            line.toLowerCase().includes('list')
        )) {
            foundNoName = true;
            console.log("헤더 행 발견:", line);
            continue;
        }
        
        // "No" 및 "Name" 행 다음부터 처리
        if (foundNoName) {
            // 더 유연한 영어 이름 패턴 검사
            // 1. 기본 패턴: 영어 + 공백 + 영어
            let englishPattern = /^([A-Za-z]+)\s+([A-Za-z]+)/;
            let match = line.match(englishPattern);
            
            if (match) {
                const extractedText = match[0];
                const firstName = match[1];
                const lastName = match[2];
                
                // 추가 검증: 각 단어가 최소 2글자 이상
                if (firstName.length >= 2 && lastName.length >= 2) {
                    processedData.push(extractedText);
                    console.log("패턴 매칭 (기본):", extractedText);
                    continue;
                }
            }
            
            // 2. 확장 패턴: 영어 + 공백 + 영어 + 추가 텍스트
            englishPattern = /^([A-Za-z]+)\s+([A-Za-z]+)/;
            match = line.match(englishPattern);
            
            if (match) {
                const extractedText = match[0];
                const firstName = match[1];
                const lastName = match[2];
                
                if (firstName.length >= 2 && lastName.length >= 2) {
                    processedData.push(extractedText);
                    console.log("패턴 매칭 (확장):", extractedText);
                    continue;
                }
            }
            
            // 3. 단일 영어 단어 패턴 (성만 있는 경우)
            const singleWordPattern = /^([A-Za-z]{3,})$/;
            match = line.match(singleWordPattern);
            
            if (match) {
                const extractedText = match[1];
                processedData.push(extractedText);
                console.log("패턴 매칭 (단일):", extractedText);
                continue;
            }
        }
    }
    
    totalCount = processedData.length;
    extractedData = processedData;
    
    console.log("=== 처리 결과 ===");
    console.log("총 처리된 데이터:", totalCount);
    console.log("처리된 데이터:", processedData);
    
    if (totalCount > 0) {
        saveToFile(processedData);
    } else {
        // 원본 텍스트를 파일로 저장하여 디버깅 가능하게 함
        saveDebugFile(text);
        alert("조건에 맞는 데이터를 찾을 수 없습니다.\n\n확인사항:\n- 이미지에 'No'와 'Name'이 포함된 헤더가 있는지\n- 헤더 다음에 영어 이름이 있는지\n\n디버그 파일이 생성되었습니다.");
    }
}

// 디버그용 파일 저장 (원본 텍스트)
function saveDebugFile(text) {
    try {
        const header = `OCR 추출 원본 텍스트\n생성일시: ${new Date().toLocaleString('ko-KR')}\n${'='.repeat(50)}\n`;
        const content = header + text;
        
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'debug_ocr_result.txt';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(link.href);
        
        console.log("디버그 파일 저장됨: debug_ocr_result.txt");
        
    } catch (error) {
        console.error("디버그 파일 저장 중 오류:", error);
    }
}

// 데이터를 aa.txt 파일로 저장
function saveToFile(data) {
    try {
        // 헤더 추가
        const header = `추출된 이름 데이터 (총 ${data.length}건)\n생성일시: ${new Date().toLocaleString('ko-KR')}\n${'='.repeat(50)}\n`;
        const content = header + data.join('\n');
        
        // Blob 생성
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        
        // 다운로드 링크 생성
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'aa.txt';
        
        // 자동 다운로드 실행
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 메모리 정리
        URL.revokeObjectURL(link.href);
        
        // 파일 저장 위치 정보 표시
        showFileLocationInfo(data);
        
        console.log("저장된 데이터:", data);
        
    } catch (error) {
        console.error("파일 저장 중 오류:", error);
        alert("파일 저장 중 오류가 발생했습니다.");
    }
}

// 파일 저장 위치 정보 표시
function showFileLocationInfo(data) {
    // 기본 다운로드 폴더 경로 (브라우저별 다름)
    const downloadPath = getDefaultDownloadPath();
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        left: 0; top: 0;
        width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.5);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    dialog.innerHTML = `
        <div style="background: #fff; border-radius: 10px; padding: 30px; min-width: 500px; max-width: 80vw; box-shadow: 0 4px 24px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: #333;">✅ 처리 완료!</h3>
                <button onclick="this.closest('div[style*=\'position: fixed\']').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">×</button>
            </div>
            
            <div style="margin-bottom: 20px;">
                <p style="color: #333; margin-bottom: 10px;"><strong>📊 처리 결과:</strong></p>
                <ul style="color: #666; margin: 0; padding-left: 20px;">
                    <li>총 ${data.length}건의 데이터 추출 완료</li>
                    <li>파일명: <strong>aa.txt</strong></li>
                    <li>생성일시: ${new Date().toLocaleString('ko-KR')}</li>
                </ul>
            </div>
            
            <div style="margin-bottom: 20px;">
                <p style="color: #333; margin-bottom: 10px;"><strong>📁 파일 저장 위치:</strong></p>
                <div style="background: #f5f5f5; border: 1px solid #ddd; border-radius: 5px; padding: 15px; font-family: monospace; font-size: 14px; color: #333;">
                    ${downloadPath}
                </div>
                <p style="color: #666; font-size: 12px; margin-top: 8px;">
                    💡 브라우저 설정에 따라 다운로드 폴더가 다를 수 있습니다.
                </p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <p style="color: #333; margin-bottom: 10px;"><strong>📋 추출된 데이터 미리보기:</strong></p>
                <div style="background: #f9f9f9; border: 1px solid #eee; border-radius: 5px; padding: 15px; max-height: 150px; overflow-y: auto; font-family: monospace; font-size: 12px; color: #333;">
                    ${data.slice(0, 10).join('\n')}${data.length > 10 ? '\n...' : ''}
                </div>
                <p style="color: #666; font-size: 12px; margin-top: 8px;">
                    ${data.length > 10 ? `총 ${data.length}건 중 처음 10건만 표시됩니다.` : ''}
                </p>
            </div>
            
            <div style="display: flex; justify-content: center; gap: 15px;">
                <button onclick="this.closest('div[style*=\'position: fixed\']').remove()" style="padding: 10px 20px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer;">확인</button>
                <button onclick="openFileLocation()" style="padding: 10px 20px; border: 1px solid #007bff; border-radius: 4px; background: #007bff; color: white; cursor: pointer;">폴더 열기</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
}

// 기본 다운로드 경로 반환
function getDefaultDownloadPath() {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Windows')) {
        return 'C:\\Users\\[사용자명]\\Downloads\\aa.txt';
    } else if (userAgent.includes('Mac')) {
        return '/Users/[사용자명]/Downloads/aa.txt';
    } else if (userAgent.includes('Linux')) {
        return '/home/[사용자명]/Downloads/aa.txt';
    } else {
        return '[브라우저 다운로드 폴더]/aa.txt';
    }
}

// 파일 위치 열기 (브라우저 제한으로 인해 실제로는 열 수 없지만 안내 메시지 표시)
function openFileLocation() {
    const userAgent = navigator.userAgent;
    let message = '';
    
    if (userAgent.includes('Windows')) {
        message = 'Windows 탐색기에서 다음 경로를 확인하세요:\nC:\\Users\\[사용자명]\\Downloads\\aa.txt';
    } else if (userAgent.includes('Mac')) {
        message = 'Finder에서 다음 경로를 확인하세요:\n/Users/[사용자명]/Downloads/aa.txt';
    } else if (userAgent.includes('Linux')) {
        message = '파일 관리자에서 다음 경로를 확인하세요:\n/home/[사용자명]/Downloads/aa.txt';
    } else {
        message = '브라우저의 다운로드 폴더에서 aa.txt 파일을 확인하세요.';
    }
    
    alert(message);
}

// 디버깅을 위한 수동 테스트 함수
function testWithSampleText() {
    const sampleText = `
Header Information
ID   No    Name         Age    Country
1    001   John Smith   25     USA
2    002   Mary Johnson 30     UK
3    003   David Wilson 28     Canada
4    004   Sarah Brown  32     Australia
5    005   Michael Davis 27    USA
Footer Information
Total Records: 5
    `;
    
    console.log("샘플 텍스트로 테스트 중...");
    processExtractedText(sampleText);
}

// 전역 함수로 노출 (콘솔에서 테스트 가능)
window.testImageToExcel = testWithSampleText;

// 로딩 다이얼로그 표시
function showLoadingDialog(message, progress) {
    let dialog = document.getElementById('ocrLoadingDialog');
    
    if (!dialog) {
        dialog = document.createElement('div');
        dialog.id = 'ocrLoadingDialog';
        dialog.style.cssText = `
            position: fixed;
            left: 0; top: 0;
            width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        dialog.innerHTML = `
            <div style="background: #fff; border-radius: 10px; padding: 30px; min-width: 400px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.3);">
                <h3 id="loadingMessage" style="margin-top: 0; color: #333; margin-bottom: 25px;">${message}</h3>
                <div style="background: #f0f0f0; border-radius: 10px; height: 20px; overflow: hidden; margin-bottom: 15px;">
                    <div id="progressBar" style="background: #4CAF50; height: 100%; width: ${progress}%; transition: width 0.3s ease;"></div>
                </div>
                <div id="progressText" style="color: #666; font-size: 14px;">${progress}%</div>
            </div>
        `;
        
        document.body.appendChild(dialog);
    }
    
    dialog.style.display = 'flex';
}

// 로딩 다이얼로그 진행률 업데이트
function updateLoadingProgress(message, progress) {
    const dialog = document.getElementById('ocrLoadingDialog');
    if (dialog) {
        const messageEl = dialog.querySelector('#loadingMessage');
        const progressBar = dialog.querySelector('#progressBar');
        const progressText = dialog.querySelector('#progressText');
        
        if (messageEl) messageEl.textContent = message;
        if (progressBar) progressBar.style.width = progress + '%';
        if (progressText) progressText.textContent = progress + '%';
    }
}

// 로딩 다이얼로그 숨기기
function hideLoadingDialog() {
    const dialog = document.getElementById('ocrLoadingDialog');
    if (dialog) {
        dialog.style.display = 'none';
    }
}