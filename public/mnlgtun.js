let scale = []
let binstring = ""
let bindata
let nameInput = ""

var lastPressedConvertScale = false

const OCTAVETUNINGSIZE = 12
const SCALETUNINGSIZE = 128

const cents_to_bin = (cents, bytestringOut) => {
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
    for (let i = 0; i <= edo; i++) {
        scale.push(1200 / edo * i)
    }
}

function injectScale() {
    document.getElementById('scale').textContent = scale.join('\n')
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

function downloadData() {
    var a = document.createElement("a")
    document.body.appendChild(a)
    a.style = "display: none"

    var blob = new Blob([bindata], {type: "octet/stream"})
    var url = window.URL.createObjectURL(blob)

    a.href = url
    a.download = "tuningdata.bin"
    a.click()
    window.URL.revokeObjectURL(url)
}

function easyZip(useScale=true, filename="scale.mnlgtuno") {
    let tunbin = useScale ? 'TunS_000.TunS_bin' : 'TunO_000.TunO_bin'
    let infobin = useScale ? 'TunS_000.TunS_info' : 'TunO_000.TunO_info'
    let infobinpath = useScale ? './tuneScaleInformation.xml' : './tuneOctaveInformation.xml'
    let filexmlpath = useScale ? './scaleFileInformation.xml' : './octaveFileInformation.xml'
    
    let zip = new JSZip()
    zip.file(tunbin, bindata)
    fetch(infobinpath)
    .then( response => { 
        //console.log(result.text())
        zip.file(infobin, response.text())
    })
    .then( () => {
        fetch(filexmlpath).then( response => {
            //console.log(response.text())
            zip.file('FileInformation.xml', response.text())
    
        })
        .then( () => {
                zip.generateAsync({type:"base64"}).then( (base64) => {
                    window.location = "data:application/zip;base64," + base64
                }, (err) => console.log )
        })
    })
}

function fileSaverDownload(useScale=true, filename="scale.mnlgtuno") {
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