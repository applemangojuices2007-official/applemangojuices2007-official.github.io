document.getElementById('pdf-file').addEventListener('change', function (event) {
	if (document.querySelector('input[name="async"]:checked').value == "async_true") {
		async_handleFileSelect(event);
	}
	else if (document.querySelector('input[name="async"]:checked').value == "async_false") {
		handleFileSelect(event);
	}
	else {
		async_handleFileSelect(event);
	}
});

function getToday(){
    var date = new Date();
    var year = date.getFullYear();
    var month = ("0" + (1 + date.getMonth())).slice(-2);
    var day = ("0" + date.getDate()).slice(-2);

    return year + month + day;
}

function popup(url) {
	const newWindow = window.open('', 'pdfpreview');
	if (newWindow) {
	    // 새 창의 document 객체를 가져옴
	    const doc = newWindow.document;
	    doc.write(`
	 		<!DOCTYPE html>
			<html lang="ko">
			    <head>
			        <meta charset="UTF-8">
			        <meta name="viewport" content="width=device-width, initial-scale=1.0">
			        <meta name="theme-color" content="#e8ac33">
			        <meta name="apple-mobile-web-app-status-bar-style" content="#e8ac33">
			        <link href="https://fonts.googleapis.com/css2?family=Nanum+Gothic&display=swap" rel="stylesheet">
			        <link rel="shortcut icon" type="image/x-icon" href="icon.ico">
			        <title>PDF to JPG Preview - applemangojuices2007</title>
			        <style>
			            html,
			            body {
			                margin: 0;
			                padding: 0;
			                height: 100%;
			            }
			    
			            #images-container {
			                display: flex;
			                flex-wrap: wrap;
			                gap: 10px;
			                display: block;
			            }
			    
			            .pdf-image {
			                max-width: 100%;
			                border: 1px solid #ccc;
			            }
			    
			            #pdf-file {
			                font-size: 100%;
			            }
			        </style>
			    </head>
			    <body>
			        <img src="` + url + `" style="max-width: 100%; height: auto; vertical-align: bottom;">
			    </body>
			</html>
		`);
		doc.close();
	}
}

function handleFileSelect(event) {
	console.log('비동기 모드로 실행')
	const file = event.target.files[0];
	if (file) {
		const fileReader = new FileReader();
		fileReader.onload = function (e) {
			const pdfData = new Uint8Array(e.target.result);
			loadPDF(pdfData);  // 비동기적으로 PDF 파일을 로드하고 변환
		};
		fileReader.readAsArrayBuffer(file);
	}
}

async function async_handleFileSelect(event) {
	const file = event.target.files[0];
	if (file) {
		console.log('동기 모드로 실행')
		const fileReader = new FileReader();
		if (document.querySelector('input[name="async"]:checked').value == "async_true") {
			fileReader.onload = async function (e) {
				const pdfData = new Uint8Array(e.target.result);
				await async_loadPDF(pdfData);  // 동기적으로 PDF 파일을 로드하고 변환
			};
		}
		else if (document.querySelector('input[name="async"]:checked').value == "async_false") {
			console.log('비동기 모드로 실행')
			fileReader.onload = function (e) {
				const pdfData = new Uint8Array(e.target.result);
				loadPDF(pdfData);  // 비동기적으로 PDF 파일을 로드하고 변환
			};
		}
		else {
			console.log('동기 모드로 실행')
			fileReader.onload = async function (e) {
				const pdfData = new Uint8Array(e.target.result);
				await async_loadPDF(pdfData);  // 동기적으로 PDF 파일을 로드하고 변환
			};
		}
		fileReader.readAsArrayBuffer(file);
	}
}

let convertedfiles = 0;

async function async_loadPDF(pdfData) {
	convertedfiles = 0;
	document.getElementById('convertstatuscolor').innerHTML = '파일 불러오는 중';
	document.getElementById('convertstatuscolor').style.color = '#f2ff00';
	document.getElementById('images-container').innerHTML = '';
	document.getElementById('images-container-preview').innerHTML = '';
	document.getElementById("downloadallbutton").innerHTML = '';

	try {
		// PDF.js를 사용하여 PDF 파일을 로드합니다.
		const pdf = await pdfjsLib.getDocument(pdfData).promise;
		console.log('PDF loaded');
		const numPages = pdf.numPages;

		// 모든 페이지를 동기적으로 렌더링합니다.
		for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
			await async_renderPage(pdf, pageNumber, numPages);
		}
	} catch (error) {
		console.error('Error loading PDF:', error);
		document.getElementById('convertstatuscolor').innerHTML = '오류 발생: ' + error;
		document.getElementById('convertstatuscolor').style.color = '#FF0000';
	}
}

async function async_renderPage(pdf, pageNumber, numPages) {
	try {
		const page = await pdf.getPage(pageNumber);
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		// 페이지의 크기 (너비, 높이)를 확인
		const originalWidth = page.getViewport({ scale: 1 }).width;
		const originalHeight = page.getViewport({ scale: 1 }).height;
		let viewport = page.getViewport({ scale: (2000 / originalWidth) });
		if (document.getElementById('auto_size').checked) {
			width = document.getElementById('size_width_value').value;
			height = document.getElementById('size_height_value').value;
			if (document.querySelector('input[name="size_custom"]:checked').value == "size_width" && width) {
				viewport = page.getViewport({ scale: (width / originalWidth) });
			}
			else if (document.querySelector('input[name="size_custom"]:checked').value == "size_height" && height) {
				viewport = page.getViewport({ scale: (height / originalHeight) });
			}
			else {
				viewport = page.getViewport({ scale: (2000 / originalWidth) });
			}
		}
		else {
			viewport = page.getViewport({ scale: (2000 / originalWidth) });
		}
		canvas.width = viewport.width;
		canvas.height = viewport.height;

		// 페이지를 캔버스에 렌더링합니다.
		await page.render({ canvasContext: ctx, viewport: viewport }).promise;

		// 캔버스를 JPG 이미지로 변환
		await async_convertCanvasToJPG(canvas, pageNumber, numPages);
	} catch (error) {
		console.error('Error rendering page:', error);
	}
}

async function async_convertCanvasToJPG(canvas, pageNumber, numPages) {
	// 캔버스를 JPG 이미지로 변환
	const dataURL = canvas.toDataURL('image/jpeg');

	// 이미지를 화면에 표시
	const imgElement = document.createElement('img');
	imgElement.src = dataURL;
	imgElement.classList.add('pdf-image');
	imgElement.style.order = pageNumber;
	// 이미지 컨테이너에 추가
	const imagesContainer = document.getElementById('images-container');
	const imagesContainerPreview = document.getElementById('images-container-preview');
	//imagesContainer.appendChild(imgElement);
	// 링크 만들기
	const aElement = document.createElement("a");
	aElement.href = dataURL;
	aElement.target = "_blank"
	aElement.download = 'pdf_' + getToday() + '_'  + pageNumber + '.jpg';
	aElement.innerHTML = pageNumber + "페이지 다운로드";
	aElement.style.textDecoration = "none";
	aElement.style.color = '#1ce6cb';
	aElement.style.width = '100%';
	aElement.style.order = pageNumber;
	imagesContainer.append(aElement);

	const aElementPreview = document.createElement("button");
	// aElementPreview.target = "_blank"
	aElementPreview.style.textDecoration = "none";
	aElementPreview.style.width = '100%';
	aElementPreview.style.paddingtop = '0.7%';
	aElementPreview.style.paddingbottom = '0.7%';
	aElementPreview.style.fontsize = '100%';
	aElementPreview.style.order = pageNumber;
	aElementPreview.setAttribute("onclick", `popup('${dataURL}')`);
	aElementPreview.innerHTML = pageNumber + "페이지 미리보기";
	imagesContainerPreview.append(aElementPreview);

	console.log(pageNumber);

	convertedfiles += 1;
	document.getElementById('convertstatuscolor').innerHTML = '파일 변환 중(' + convertedfiles + '/' + numPages + ')';
	document.getElementById('convertstatuscolor').style.color = '#f2ff00';

	if (convertedfiles === numPages) {
		document.getElementById('convertstatuscolor').innerHTML = '파일 변환 완료';
		document.getElementById('convertstatuscolor').style.color = '#00ff00';
		document.getElementById('pagenumber').innerHTML = '페이지 수: ' + numPages;

		const downloadElement = document.createElement("button");
		downloadElement.innerHTML = "모두 다운로드(zip 파일)";
		downloadElement.setAttribute("onclick", "async_downloadAllFiles()");
		downloadElement.style.fontSize = '100%';
		downloadElement.style.marginBottom = '3%';
		downloadElement.id = "zipdownloadbutton";
		document.getElementById("downloadallbutton").append(downloadElement);
	}
}

function loadPDF(pdfData) {
	convertedfiles = 0;
	document.getElementById('convertstatuscolor').innerHTML = '파일 불러오는 중';
	document.getElementById('convertstatuscolor').style.color = '#f2ff00'
	document.getElementById('images-container').innerHTML = '';
	document.getElementById('images-container-preview').innerHTML = '';
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
		let viewport = page.getViewport({ scale: (2000 / originalWidth) });
		if (document.getElementById('auto_size').checked) {
			width = document.getElementById('size_width_value').value;
			height = document.getElementById('size_height_value').value;
			if (document.querySelector('input[name="size_custom"]:checked').value == "size_width" && width) {
				viewport = page.getViewport({ scale: (width / originalWidth) });
			}
			else if (document.querySelector('input[name="size_custom"]:checked').value == "size_height" && height) {
				viewport = page.getViewport({ scale: (height / originalHeight) });
			}
			else {
				viewport = page.getViewport({ scale: (2000 / originalWidth) });
			}
		}
		else {
			viewport = page.getViewport({ scale: (2000 / originalWidth) });
		}
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
	const imagesContainerPreview = document.getElementById('images-container-preview');
	//imagesContainer.appendChild(imgElement);
	// 링크 만들기
	const aElement = document.createElement("a");
	aElement.href = dataURL;
	aElement.target = "_blank"
	aElement.download = 'pdf_' + getToday() + '_'  + pageNumber + '.jpg';
	aElement.innerHTML = pageNumber + "페이지 다운로드";
	aElement.style.textDecoration = "none";
	aElement.style.color = '#1ce6cb';
	aElement.style.width = '100%';
	aElement.style.order = pageNumber;
	imagesContainer.append(aElement);

	const aElementPreview = document.createElement("button");
	// aElementPreview.target = "_blank"
	aElementPreview.style.textDecoration = "none";
	aElementPreview.style.width = '100%';
	aElementPreview.style.paddingtop = '0.7%';
	aElementPreview.style.paddingbottom = '0.7%';
	aElementPreview.style.fontsize = '100%';
	aElementPreview.style.order = pageNumber;
	aElementPreview.setAttribute("onclick", `popup('${dataURL}')`);
	aElementPreview.innerHTML = pageNumber + "페이지 미리보기";
	imagesContainerPreview.append(aElementPreview);

	convertedfiles += 1;
	document.getElementById('convertstatuscolor').innerHTML = '파일 변환 중(' + convertedfiles + '/' + numPages + ')';
	document.getElementById('convertstatuscolor').style.color = '#f2ff00'
	if (convertedfiles == numPages) {
		document.getElementById('convertstatuscolor').innerHTML = '파일 변환 완료';
		document.getElementById('convertstatuscolor').style.color = '#00ff00'

		document.getElementById('pagenumber').innerHTML = '페이지 수: ' + numPages;

		const downloadElement = document.createElement("button");
		downloadElement.innerHTML = "모두 다운로드(zip 파일)"
		downloadElement.setAttribute("onclick", "async_downloadAllFiles()");
		downloadElement.style.fontSize = '100%';
		downloadElement.style.marginBottom = '3%';
		downloadElement.id = "zipdownloadbutton";
		document.getElementById("downloadallbutton").append(downloadElement);
	}
}

async function async_downloadAllFiles() {
	document.getElementById("zipdownloadbutton").innerHTML = "zip 파일 생성 중...";
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
	for (const [index, link] of links.entries()) {
		const fileUrl = link.href;
		const fileName = link.download || `file${index + 1}.jpg`;  // 파일 이름

		const filePromise = fetch(fileUrl)
			.then(response => response.blob())  // 파일을 Blob 형식으로 다운로드
			.then(blob => {
				zip.file(fileName, blob);  // ZIP 파일에 파일 추가
			})
			.catch(error => console.error(`파일 다운로드 실패: ${fileName}`, error));

		promises.push(filePromise);
		document.getElementById("zipdownloadbutton").innerHTML = "zip 파일 생성 중...(" + (index + 1) + "/" + (links.length) + ")";
	}

	// 모든 파일 다운로드가 완료되면 ZIP 파일을 생성하여 다운로드
	try {
		document.getElementById("zipdownloadbutton").innerHTML = "zip 파일을 다운로드 준비 중...";
		await Promise.all(promises);
		const content = await zip.generateAsync({ type: 'blob' });
		document.getElementById("zipdownloadbutton").innerHTML = "zip 파일을 다운로드합니다.";
		saveAs(content, 'jpg-files.zip');
		document.getElementById("zipdownloadbutton").innerHTML = "다시 다운로드하기";
	} catch (error) {
		console.error('ZIP 파일 생성 실패:', error);
		document.getElementById("zipdownloadbutton").innerHTML = "zip 파일 생성 실패";
	}
}

document.getElementById('auto_size').addEventListener('change', function (event) {
	if (event.target.checked) {
		document.getElementById("size_width").disabled = false;
		document.getElementById("size_height").disabled = false;
		if (document.querySelector('input[name="size_custom"]:checked')) {
			if (document.querySelector('input[name="size_custom"]:checked').value == "size_width") {
				document.getElementById("size_width_value").disabled = false;
				document.getElementById("size_height_value").disabled = true;
			}
			else if (document.querySelector('input[name="size_custom"]:checked').value == "size_height") {
				document.getElementById("size_width_value").disabled = true;
				document.getElementById("size_height_value").disabled = false;
			}
			else {
				document.getElementById("size_width_value").disabled = false;
				document.getElementById("size_height_value").disabled = false;
			}
		}
	} else {
		document.getElementById("size_width").disabled = true;
		document.getElementById("size_height").disabled = true;
		document.getElementById("size_width_value").disabled = true;
		document.getElementById("size_height_value").disabled = true;
	}
});

const sizeradios = document.querySelectorAll('input[name="size_custom"]');

sizeradios.forEach(radio => {
	radio.addEventListener('change', function (event) {
		alert("선택된 옵션: " + event.target.value);
		if (event.target.value == "size_width") {
			document.getElementById("size_width_value").disabled = false;
			document.getElementById("size_height_value").disabled = true;
		}
		else if (event.target.value == "size_height") {
			document.getElementById("size_width_value").disabled = true;
			document.getElementById("size_height_value").disabled = false;
		}
		else {
			document.getElementById("size_width_value").disabled = false;
			document.getElementById("size_height_value").disabled = false;
		}
	});
});




