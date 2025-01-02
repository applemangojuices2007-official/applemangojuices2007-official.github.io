document.getElementById('pdf-file').addEventListener('change', handleFileSelect);

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const fileReader = new FileReader();
        fileReader.onload = function(e) {
            const pdfData = new Uint8Array(e.target.result);
            loadPDF(pdfData);
        };
        fileReader.readAsArrayBuffer(file);
    }
}

let convertedfiles = 0;

function loadPDF(pdfData) {
    convertedfiles = 0;
    document.getElementById('convertstatuscolor').innerHTML = '파일 불러오는 중';
    document.getElementById('convertstatuscolor').style.color = '#f2ff00'
    document.getElementById('images-container').innerHTML = '';
    document.getElementById("downloadallbutton").innerHTML = '';

    // PDF.js를 사용하여 PDF 파일을 로드합니다.
    pdfjsLib.getDocument(pdfData).promise.then((pdf) => {
        console.log('PDF loaded');
        const numPages = pdf.numPages;
        for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
            renderPage(pdf, pageNumber, numPages);
        }
    }).catch(error => {
        console.error('Error loading PDF:', error);
        document.getElementById('convertstatuscolor').innerHTML = '오류 발생: ' + error;
        document.getElementById('convertstatuscolor').style.color = '#FF0000'
    });
}

function renderPage(pdf, pageNumber, numPages) {
    pdf.getPage(pageNumber).then((page) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 페이지의 크기 (너비, 높이)를 확인
        const originalWidth = page.getViewport({ scale: 1 }).width;
        const originalHeight = page.getViewport({ scale: 1 }).height;

        const viewport = page.getViewport({ scale: (2000/originalWidth) });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // 페이지를 캔버스에 렌더링합니다.
        page.render({ canvasContext: ctx, viewport: viewport }).promise.then(() => {
            // 캔버스에서 JPG 이미지를 생성합니다.
            convertCanvasToJPG(canvas, pageNumber, numPages);
        });
    });
}

function convertCanvasToJPG(canvas, pageNumber, numPages) {
    // 캔버스를 JPG 이미지로 변환
    const dataURL = canvas.toDataURL('image/jpeg');
    
    // 이미지를 화면에 표시
    const imgElement = document.createElement('img');
    imgElement.src = dataURL;
    imgElement.classList.add('pdf-image');
    imgElement.style.order = pageNumber;
    // 이미지 컨테이너에 추가
    const imagesContainer = document.getElementById('images-container');
    //imagesContainer.appendChild(imgElement);
    // 링크 만들기
    const aElement = document.createElement("a");
    aElement.href = dataURL;
    aElement.target = "_blank"
    aElement.download = pageNumber + '.jpg';
    aElement.innerHTML = pageNumber + "페이지 다운로드";
    aElement.style.textDecoration = "none";
    aElement.style.color = '#1ce6cb';
    aElement.style.width = '100%';
    aElement.style.order = pageNumber;
    imagesContainer.append(aElement);
    console.log(pageNumber);

    convertedfiles += 1;
    document.getElementById('convertstatuscolor').innerHTML = '파일 변환 중(' + convertedfiles + '/' + numPages + ')';
    document.getElementById('convertstatuscolor').style.color = '#f2ff00'
    if(convertedfiles == numPages) {
        document.getElementById('convertstatuscolor').innerHTML = '파일 변환 완료';
        document.getElementById('convertstatuscolor').style.color = '#00ff00'

        document.getElementById('pagenumber').innerHTML = '페이지 수: ' + numPages;

        const downloadElement = document.createElement("button");
        downloadElement.innerHTML = "모두 다운로드(zip 파일)"
        downloadElement.setAttribute("onclick", "downloadAllFiles()");
        downloadElement.style.fontSize = '100%';
        downloadElement.style.marginBottom = '3%';
        document.getElementById("downloadallbutton").append(downloadElement);
    }
}

function downloadAllFiles() {
    const zip = new JSZip();  // 새 ZIP 파일 생성
    const links = Array.from(document.querySelectorAll('.images-container a'));  // 모든 <a> 태그를 선택
    const promises = [];

    // order 속성을 기준으로 정렬
    links.sort((a, b) => {
      const orderA = parseInt(window.getComputedStyle(a).order);
      const orderB = parseInt(window.getComputedStyle(b).order);
      return orderA - orderB;
    });

    // 정렬된 링크를 순차적으로 다운로드
    links.forEach((link, index) => {
      const fileUrl = link.href;
      const fileName = link.download || `file${index + 1}.jpg`;  // 파일 이름

      const filePromise = fetch(fileUrl)
        .then(response => response.blob())  // 파일을 Blob 형식으로 다운로드
        .then(blob => {
          zip.file(fileName, blob);  // ZIP 파일에 파일 추가
        })
        .catch(error => console.error(`파일 다운로드 실패: ${fileName}`, error));

      promises.push(filePromise);
    });

    // 모든 파일 다운로드가 완료되면 ZIP 파일을 생성하여 다운로드
    Promise.all(promises).then(() => {
      zip.generateAsync({ type: 'blob' })
        .then(content => {
          // ZIP 파일 다운로드
          saveAs(content, 'jpg-files.zip');
        })
        .catch(error => console.error('ZIP 파일 생성 실패:', error));
    });
  }