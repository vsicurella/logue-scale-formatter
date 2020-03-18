let scale = []
let binstring = ""
let bindata
let nameInput = ""

var lastPressedConvertScale = false

const OCTAVETUNINGSIZE = 12
const SCALETUNINGSIZE = 128

const cents_to_bin = (cents, bytestringOut) => {
    if (cents < 0) cents = 0
    else if (cents >= 12800) cents = 12800
    let semitones = parseInt(cents) / 100.0
    let coarseSteps = Math.floor(semitones)
    let fractionalSteps = semitones - coarseSteps
        
    var bit0 = String.fromCharCode(coarseSteps)

    let integer = Math.round(0x8000 * fractionalSteps)
    let u16a = new Uint16Array([integer])
    let u8a = new Uint8Array(u16a.buffer)

    let binarray = new Uint8Array([coarseSteps, u8a[1], u8a[0]])
    bytestringOut = bit0 + String.fromCharCode(u8a[1]) + String.fromCharCode(u8a[0])

    return binarray
}

function edoScale(edo) {
    scale = []
    var step = 1200 / parseInt(edo)
    for (let i = 0; i <= SCALETUNINGSIZE; i++) {
        scale.push(step * i)
    }
}

function injectScale() {
    document.getElementById('scale').textContent = scale.join('\n')
}

function checkNameInput() {
    let name = document.getElementById('name').value.split('.')
    
    while (name.length < 2) {
        name.push('')
    }

    if (name[0] === '')
        name[0] = 'tuning'

    if (lastPressedConvertScale) {
        name[name.length-1] = 'mnlgtuns'
    } else {
        name[name.length-1] = 'mnlgtuno'
    }

    document.getElementById('name').value = name.join('.')
}

function formatScale() {
    scale = document.getElementById('scale').value.split('\n').map(c => parseFloat(c))
    
    // pad so that scale is at least 128 notes
    while (scale.length < 128) {
        scale.push(scale[scale.length-1])
    }

    let rootMidiNote = parseInt(document.getElementById('midiRootInput').value)
    let rootFreq = parseFloat(document.getElementById('rootFreqInput').value)

    var goodInput = (rootMidiNote >= 0 && rootMidiNote < 128) && (rootFreq >= 20 && rootFreq < 16e3)
    if (!goodInput)
        alert("Warning, input not parsed successfully.")
    
    rootMidiNote = goodInput ? rootMidiNote : 69
    rootFreq = goodInput ? rootFreq : 440

    let currentRootCents = scale[rootMidiNote]
    
    // calculate Frequency offset
    // find closest note in 12edo a4=440
    let rootCentsFromA = Math.log2(440 / rootFreq) * 1200
    let rootCentsDifference = 6900 - rootCentsFromA
    let scaleDifference = currentRootCents - rootCentsDifference

    scale = scale.map(c => c - scaleDifference)
    injectScale()
}

function convertScale() {
    let dataSize = SCALETUNINGSIZE * 3
    bindata = new Uint8Array(dataSize)
    binstring = ""

    scale = document.getElementById('scale').value.split('\n').map(c => parseFloat(c))
    console.log(scale)
    for (let i = 0; i < SCALETUNINGSIZE; i++) {
        let cents = 0
        if (i < scale.length)
            cents = scale[i]
        
        let binarray = cents_to_bin(cents)
        for (let b = 0; b < 3; b++) {
            let bit = b < binarray.length ? binarray[b] : 0
            bindata[(i * 3) + b] = bit
        }
    }

    bindata.forEach( b => binstring += String.fromCharCode(b))
    lastPressedConvertScale = true
    document.getElementById('binary').textContent = binstring
}

function convertOctave() {
    let dataSize = OCTAVETUNINGSIZE * 3
    bindata = new Uint8Array(dataSize)
    binstring = ""

    scale = document.getElementById('scale').value.split('\n').map(c => parseFloat(c))
    for (let i = 0; i < OCTAVETUNINGSIZE; i++) {
        let cents = 0
        if (i < scale.length)
            cents = scale[i]
        
        let binarray = cents_to_bin(cents)
        for (let b = 0; b < 3; b++) {
            let bit = b < binarray.length ? binarray[b] : 0
            bindata[(i * 3) + b] = bit
        }
    }

    bindata.forEach( b => binstring += String.fromCharCode(b))
    lastPressedConvertScale = false
    document.getElementById('binary').textContent = binstring
}

function fileSaverDownload(useScale=true) {
    checkNameInput()
    let filename  = document.getElementById('name').value
    let tunbin = useScale ? 'TunS_000.TunS_bin' : 'TunO_000.TunO_bin'
    let infobin = useScale ? 'TunS_000.TunS_info' : 'TunO_000.TunO_info'
    let infobinpath = useScale ? './tuneScaleInformation.xml' : './tuneOctaveInformation.xml'
    let filexmlpath = useScale ? './scaleFileInformation.xml' : './octaveFileInformation.xml'
    
    let zip = new JSZip()
    zip.file(tunbin, bindata)
    fetch(infobinpath)
    .then( response => { 
        zip.file(infobin, response.text())
    })
    .then( () => {
        fetch(filexmlpath).then( response => {
            zip.file('FileInformation.xml', response.text())
    
        })
        .then( () => {
                zip.generateAsync({type:"blob"}).then( (blob) => {
                   saveAs(blob, filename)
                }, (err) => alert(err) )
        })
    })
}

document.getElementById("getScale").onclick = (event) => {
    let divisions = parseInt(document.getElementById("edoInput").value)
    edoScale(divisions)
    injectScale()
}


edoScale(12)
injectScale()