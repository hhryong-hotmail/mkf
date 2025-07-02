// Tesseract.js를 사용한 이미지에서 엑셀 변환
class ImageToExcel {
    constructor() {
        this.worker = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('Tesseract 초기화 중...');
            this.worker = await Tesseract.createWorker({
                logger: m => console.log(m)
            });
            
            await this.worker.loadLanguage('eng+khm');
            await this.worker.initialize('eng+khm');
            this.isInitialized = true;
            console.log('Tesseract 초기화 완료');
        } catch (error) {
            console.error('Tesseract 초기화 실패:', error);
            throw error;
        }
    }

    async extractTextFromImage(file) {
        if (!this.isInitialized) {
            throw new Error('Tesseract가 초기화되지 않았습니다.');
        }

        try {
            console.log('이미지에서 텍스트 추출 중...');
            const result = await this.worker.recognize(file);
            console.log('텍스트 추출 완료:', result.data.text);
            return result.data.text;
        } catch (error) {
            console.error('텍스트 추출 실패:', error);
            throw error;
        }
    }

    parseData(text) {
        console.log('데이터 파싱 시작...');
        const lines = text.split('\n').filter(line => line.trim());
        const data = [];
        let currentRecord = {};

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            console.log(`라인 ${i + 1}: ${line}`);

            // 빈 줄 건너뛰기
            if (!line) continue;

            // 헤더 라인 건너뛰기
            if (line.toLowerCase().includes('name') && line.toLowerCase().includes('gender')) {
                console.log('헤더 라인 건너뛰기:', line);
                continue;
            }

            // 날짜 패턴 확인 (YYYY-MM-DD, YYYY/MM/DD 등)
            const datePattern = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/;
            if (datePattern.test(line)) {
                // 이전 라인이 이름/성별 데이터인지 확인
                if (i > 0 && lines[i - 1].trim()) {
                    const prevLine = lines[i - 1].trim();
                    if (!datePattern.test(prevLine)) {
                        // 이름과 성별 추출
                        const nameGenderMatch = prevLine.match(/^([A-Z\s]+)\s*([FM])?$/);
                        if (nameGenderMatch) {
                            const name = nameGenderMatch[1].trim();
                            const gender = nameGenderMatch[2] || '';
                            const birthday = line.replace(/[^\d\-/]/g, '');

                            data.push({
                                no: data.length + 1,
                                name: name,
                                gender: gender,
                                birthday: birthday
                            });
                            console.log(`레코드 추가: ${data.length}, ${name}, ${gender}, ${birthday}`);
                        }
                    }
                }
            }
        }

        console.log(`총 ${data.length}개의 레코드 파싱 완료`);
        return data;
    }

    generateExcel(data) {
        console.log('엑셀 파일 생성 중...');
        
        // 워크북 생성
        const wb = XLSX.utils.book_new();
        
        // 헤더 추가
        const headers = ['No', 'Name', 'Gender', 'Birthday'];
        const excelData = [headers];
        
        // 데이터 추가
        data.forEach(record => {
            excelData.push([
                record.no,
                record.name,
                record.gender,
                record.birthday
            ]);
        });

        // 워크시트 생성
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        
        // 워크북에 워크시트 추가
        XLSX.utils.book_append_sheet(wb, ws, 'Extracted Data');
        
        return wb;
    }

    downloadExcel(wb, filename = 'extracted_data.xlsx') {
        console.log('엑셀 파일 다운로드 중...');
        XLSX.writeFile(wb, filename);
        console.log('엑셀 파일 다운로드 완료');
    }

    async processImage(file) {
        try {
            // 텍스트 추출
            const text = await this.extractTextFromImage(file);
            
            // 데이터 파싱
            const data = this.parseData(text);
            
            if (data.length === 0) {
                throw new Error('추출된 데이터가 없습니다.');
            }
            
            // 엑셀 파일 생성
            const wb = this.generateExcel(data);
            
            // 파일명 생성
            const timestamp = Date.now();
            const filename = `extracted_data_${timestamp}.xlsx`;
            
            // 다운로드
            this.downloadExcel(wb, filename);
            
            return {
                success: true,
                recordCount: data.length,
                filename: filename
            };
            
        } catch (error) {
            console.error('이미지 처리 실패:', error);
            throw error;
        }
    }

    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.isInitialized = false;
            console.log('Tesseract 종료');
        }
    }
}

// 전역 변수로 인스턴스 생성
let imageToExcel = null;

// 초기화 함수
async function initializeImageToExcel() {
    try {
        imageToExcel = new ImageToExcel();
        await imageToExcel.initialize();
        console.log('ImageToExcel 초기화 완료');
        return true;
    } catch (error) {
        console.error('ImageToExcel 초기화 실패:', error);
        return false;
    }
}

// 이미지 처리 함수
async function processImageToExcel() {
    const fileInput = document.getElementById('imageFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('이미지 파일을 선택해주세요.');
        return;
    }

    if (!imageToExcel) {
        alert('ImageToExcel이 초기화되지 않았습니다. 페이지를 새로고침해주세요.');
        return;
    }

    try {
        // 로딩 표시
        const button = document.querySelector('button[onclick="processImageToExcel()"]');
        const originalText = button.textContent;
        button.textContent = '처리 중...';
        button.disabled = true;

        const result = await imageToExcel.processImage(file);
        
        alert(`처리 완료!\n총 ${result.recordCount}개의 레코드가 추출되었습니다.\n파일명: ${result.filename}`);
        
    } catch (error) {
        alert(`처리 실패: ${error.message}`);
    } finally {
        // 버튼 복원
        const button = document.querySelector('button[onclick="processImageToExcel()"]');
        button.textContent = originalText;
        button.disabled = false;
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    console.log('페이지 로드됨, ImageToExcel 초기화 시작...');
    const success = await initializeImageToExcel();
    if (success) {
        console.log('ImageToExcel 초기화 성공');
    } else {
        console.error('ImageToExcel 초기화 실패');
    }
}); 