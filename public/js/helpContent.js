// Help 모달 관련 함수들

// 도움말 기능 선택 화면으로 돌아가는 함수
function returnToHelpSelection() {
    // 현재 도움말 모달 닫기
    const resultModal = document.getElementById('resultModal');
    if (resultModal) {
        resultModal.style.display = 'none';
    }
    
    // 도움말 기능 선택 모달 열기
    const helpModal = document.getElementById('helpModal');
    if (helpModal) {
        helpModal.style.display = 'flex';
    }
}

function showHelpContent(functionType) {
    const helpContent = {
        'txt2Members': {
            title: 'Text to Members',
            description: '구글 포토에서 이미지 다운로드 \n' +
            '구글 드라이브에 업로드 후 Google Docs로 열기 \n' +
            '분리된 텍스트들을 따로 저장하여 프로그램에서 열어주세요.\n\n' +
            '1. 구글 포토에서 텍스트 추출하고 싶은 사진을 선택\n' +
            '2. 다운로드 버튼 클릭하여 컴퓨터에 저장\n' +
            '3. 구글 드라이브에 다시 업로드\n' +     
            '4. 업로드된 이미지 파일을 우클릭 (단계 1)\n' +
            '5. "연결 프로그램" → "Google Docs"로 열기 \n' +
            '6. 텍스트 추출 완료. Google Docs가 자동으로 OCR을 실행 \n' +   
            '7. 문서 상단에 원본 이미지, 하단에 추출된 텍스트가 표시됩니다. (단계 2) \n' +
            '8. 이 추출된 텍스트를 복사하여 text 파일에 붙여넣고 저장 (단계 3)\n' +            
            '9. Text to Members 버튼 클릭, 이 text 파일을 선택 \n' +
            '10. 해당 내용이 mkf db의 "new_members"에 들어간다. commit_date = 오늘 날짜 \n' +
            '11. 번호/이름(영문)/성별(F/M)/생일(YYYY-MM-DD) 로 구성 (캄보디아어는 해석 안함)' ,
            images: [
                'help/txt2members-help1.png',
                'help/txt2members-help2.png',
                'help/txt2members-help3.png'
            ]
        },
        'newMembers': {
            title: 'New Member',
            description: '새로운 회원을 엑셀로 등록하는 기능입니다.(현재 사용안함)',
            images: [
                'help/newmember-help1.png',
                'help/newmember-help2.png'
            ]
        },
        'viewMembers': {
            title: 'V (View Members)',
            description: 'new_members 테이블에서 회원 정보를 상세하게 보거나 수정하는 기능입니다.\n' +
            '1. 우측에 commit-date(입력일자)별로 검색 \n' +
            '2. 상세 데이터를 클릭하면 좌측에 전체 데이터가 보여지고 \n' +
            '3. 좌측을 수정하고 저장하면 new_members 테이블에 저장됩니다',
            images: [
                'help/viewmembers-help.png'
            ]
        },
        'excelInput': {
            title: 'gloSign 서명 등록',
            description: 'gloSign 서명이 완료된 정보를 자동 저장한 Excel 파일입니다. \n' +
            'mkf_master 테이블에 등록됩니다. 오류가 있을 경우, error_table에 등록됩니다',
            images: [
                'help/gsign-help1.png',
                'help/gsign-help2.png',
                'help/gsign-help3.png'
            ]
        },
        'bankDeposit': {
            title: 'ABA Bank Deposit',
            description: 'ABA 은행 거래 내역을 확인하여 mkf_master 테이블에 해당 정보를 등록하는 기능입니다. \n' +
            'Sender(여권번호), 입금액, 입금일자, 지점명의 정보를 mkf_master에 수정합니다',
            images: [
                'help/bankdeposit-help.png'                
            ]
        },
        'compare': {
            title: 'Compare',
            description: 'error_table과 mkf_master 데이터를 비교하여 수정하는 기능입니다.\n' +
            'glosign 서명 자료, 입금 거래 내역, passport_number, sim카드에 따른 입금 내역 등이 원칙에 맞지 않을 경우엔 error_table에 입력됩니다 \n' +
            'compare 버튼을 클릭하면 두 테이블(mkf_table, error_table)의 데이터를 비교하여 차이점을 확인하고 수정하여 mkf_master에 저장할 수 있습니다 \n' +
            '1.우측 error_table의 데이터를 검색합니다 \n' +
            '2.error_table의 데이터를 클릭하면 좌측에 상세히 표시됩니다 \n' +
            '3.좌측 항목을 수정하면 그것이 mkf_master의 데이터에 입력됩니다. ',
            images: [
                'help/compare-help1.png',
                'help/compare-help2.png'
            ]
        },
        'downloadExcel': {
            title: 'Download',
            description: '현재 화면의 데이터를 Excel 파일로 다운로드하는 기능입니다.',
            images: [
                'help/download-help.png'
            ]
        },
        'openingCheck': {
            title: 'Opening Check',
            description: '한국에서 개통된 전화번화 개통 정보입니다. 카카오톡의 문자메시지를 입력하여 mkf_master에 저장합니다.',
            images: [
                'help/opening-help.png'
            ]
        },
        'reset': {
            title: 'Reset',
            description: '모든 필터와 검색 조건을 초기화하는 기능입니다.\n' +
            'N: mkf_master 테이블에 있는 모든 데이터, E: error_table에 있는 데이터 ',            
            images: [
                'help/reset-help.png'
            ]
        },
        'search': {
            title: 'Search (검색)',
            description: '다양한 조건으로 회원 정보(mkf_master)를 검색하는 기능입니다.\n' +
            '1. ID, 국적, 이름, 여권번호, 상태 등으로 검색 가능\n' +
            '2. 확약일자(Commit Date) 범위로 검색 가능\n' +
            '   2-1. 글로사인: 사인이 완료된 날짜 \n' +
            '   2-2. 테이블: 데이터가 입력된 날짜 \n' +
            '3. 입금조회/미입금조회 체크박스로 입금 상태별 필터링\n' +
            '   3-1. 입금조회: Balance = 0 \n' +
            '   3-2. 미입금조회: Balance > 0 \n' +
            '4. 대출요청 = E9\n' +
            '5. ID: mkf_master내에서 unique한 순번 \n' +
            '   ID에 값을 입력하고 검색할 경우, 다른 조건은 무시되고 하나의 데이터만 보여줍니다 \n' +
            '6. 여권번호 역시 ID와 같은 기능을 합니다. 여권번호는 최대 9자리입니다 \n' +
            '7. 결과 리스트를 클릭하면 상세 화면으로 넘어갑니다. 상세화면에서 수정 및 저장을 할 수 있습니다 \n',
            images: [
                'help/search-help1.png',
                'help/search-help2.png'
            ]
        }
    };
    
    const content = helpContent[functionType] || {
        title: '알 수 없는 기능',
        description: '해당 기능에 대한 도움말이 없습니다.',
        images: []
    };
    
    // 결과 모달에 도움말 내용 표시
    const resultModal = document.getElementById('resultModal');
    const resultModalContent = document.getElementById('resultModalContent');
    
    if (resultModal && resultModalContent) {
        let imagesHtml = '';
        if (content.images && content.images.length > 0) {
            imagesHtml = '<div style="margin: 20px 0;">';
            
            content.images.forEach((imagePath, index) => {
                imagesHtml += `
                    <div style="text-align: center; margin: 15px 0;">
                        <h4 style="color: #666; margin: 10px 0; font-size: 14px;">단계 ${index + 1}</h4>
                        <img src="${imagePath}" alt="${content.title} 도움말 이미지 ${index + 1}" 
                             style="max-width: 100%; max-height: 350px; border: 1px solid #ddd; border-radius: 5px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 10px;"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <div style="display: none; padding: 15px; background-color: #f5f5f5; border-radius: 5px; color: #666; font-size: 14px;">
                            이미지 ${index + 1}을(를) 불러올 수 없습니다.
                        </div>
                    </div>
                `;
            });
            
            imagesHtml += '</div>';
        }
        
        // 설명 텍스트의 줄바꿈 처리
        const formattedDescription = content.description.replace(/\n/g, '<br>');
        
        resultModalContent.innerHTML = `
            <div style="max-height: 70vh; overflow-y: auto;">
                <h3 style="margin-top: 0; color: #333; position: sticky; top: 0; background: white; padding-bottom: 10px; border-bottom: 1px solid #eee;">${content.title} - 도움말</h3>
                <p style="line-height: 1.6; color: #555; margin: 15px 0;">${formattedDescription}</p>
                ${imagesHtml}
                <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
                    <button onclick="returnToHelpSelection()" 
                            style="background-color: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 14px;">
                        RETURN
                    </button>
                </div>
            </div>
        `;
        resultModal.style.display = 'flex';
    }
}
