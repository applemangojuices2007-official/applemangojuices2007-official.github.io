const igtvname = [
	'사람 vs 엘리베이터(1편)',
	'실제 지하철에 함정역 음악 합성',
	'OpenBVE와 TTS를 사용하여 제작한 가상뉴스',
	'사람 vs 엘리베이터 영상 주작 설명',
	'사람 vs 엘리베이터(2편)',
	'사람 vs 엘리베이터(3편)',
	'지하철 구동음 모음',
	'0=1, 1=2 증명',
	'이 영상에 절대로 속지 마세요(챌린지)',
	'마인크래프트가 성인게임이 돼 버린 이유',
	'줌 호스트 튕겼을 때 높은 확률로 호스트 되는법',
	'솔찬에 대한 29가지 TMI',
	'NCS 음악 6곡 모음',
	'뽀로로 함정역(팔로워 40명 특집)',
	'사람 vs 엘리베이터 1~3편 전편 몰아보기 2배속'
];
const igtvlink = [
	'COrpLu9J039',
	'COy_tVypKVJ',
	'CPQFumqgBpw',
	'CPVV_x1AS9r',
	'CPzxISaAYJy',
	'CPzyT0HAT23',
	'CQX8_jYgc_G',
	'CQnWArxny74',
	'CQtRGWZnxnO',
	'CRS65eAH0gy',
	'CRTlk2mnHoJ',
	'CRg4CBkHhv-',
	'CRqZOJAH-HK',
	'CRymxPzHAL5',
	'CR6f8oJnkvq'
];
function load() {
for(var i = 0; i<igtvname.length; i++){
	document.getElementsByClassName('igtv')[0].innerHTML += `<div class="item">
	<a href="https://www.instagram.com/tv/${igtvlink[i]}" target="_blank">
		<div class="name">${igtvname[i]}</div>
	</a>
</div>`
}
}