document.addEventListener("DOMContentLoaded", () => {
    const nameInput = document.getElementById("name")
    const photoInput = document.getElementById("photo")
    const fileNameSpan = document.getElementById("file-name")
    const downloadBtn = document.getElementById("download-btn")
    const canvas = document.getElementById("preview-canvas")
    const ctx = canvas.getContext("2d")
    const zoomInBtn = document.getElementById("zoom-in")
    const zoomOutBtn = document.getElementById("zoom-out")
    const zoomLevelSpan = document.getElementById("zoom-level")

    let userPhoto = null
    const overlayImage = new Image()
    overlayImage.src = "img/overlay.png"
    overlayImage.crossOrigin = "anonymous"

    let isDragging = false
    let startX, startY
    let currentX = 0
    let currentY = 0
    let zoomLevel = 0.2
    const MIN_ZOOM = 0.05
    const MAX_ZOOM = 1.0
    const ZOOM_STEP = 0.025

    overlayImage.onload = () => {
        canvas.width = overlayImage.width
        canvas.height = overlayImage.height

        drawCanvas()
    }

    photoInput.addEventListener("change", handlePhotoUpload)
    nameInput.addEventListener("input", drawCanvas)
    downloadBtn.addEventListener("click", downloadCard)
    zoomInBtn.addEventListener("click", zoomIn)
    zoomOutBtn.addEventListener("click", zoomOut)

    photoInput.addEventListener("change", (e) => {
        fileNameSpan.textContent = e.target.files[0]?.name || "Nenhuma imagem escolhida."
    })

    const buttons = document.querySelectorAll("button")
    buttons.forEach((button) => {
        button.addEventListener("mousedown", () => {
            if (!button.disabled) {
                button.style.transform = "scale(0.98)"
            }
        })
        button.addEventListener("mouseup", () => {
            if (!button.disabled) {
                button.style.transform = ""
            }
        })
        button.addEventListener("mouseleave", () => {
            if (!button.disabled) {
                button.style.transform = ""
            }
        })
    })

    canvas.addEventListener("mousedown", startDrag)
    canvas.addEventListener("mousemove", drag)
    canvas.addEventListener("mouseup", endDrag)
    canvas.addEventListener("mouseleave", endDrag)

    canvas.addEventListener("wheel", (e) => {
        e.preventDefault()
        if (!userPhoto) return

        if (e.deltaY < 0) {
            zoomIn()
        } else {
            zoomOut()
        }
    })

    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault()
        const touch = e.touches[0]
        const mouseEvent = new MouseEvent("mousedown", {
            clientX: touch.clientX,
            clientY: touch.clientY,
        })
        canvas.dispatchEvent(mouseEvent)
    })

    canvas.addEventListener("touchmove", (e) => {
        e.preventDefault()
        const touch = e.touches[0]
        const mouseEvent = new MouseEvent("mousemove", {
            clientX: touch.clientX,
            clientY: touch.clientY,
        })
        canvas.dispatchEvent(mouseEvent)
    })

    canvas.addEventListener("touchend", (e) => {
        e.preventDefault()
        const mouseEvent = new MouseEvent("mouseup", {})
        canvas.dispatchEvent(mouseEvent)
    })

    function handlePhotoUpload(e) {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
                userPhoto = img

                const canvasRatio = canvas.width / canvas.height
                const imageRatio = img.width / img.height

                if (imageRatio > canvasRatio) {
                    zoomLevel = (canvas.height / img.height) * 0.8
                } else {
                    zoomLevel = (canvas.width / img.width) * 0.8
                }

                zoomLevel = Math.max(MIN_ZOOM, Math.min(zoomLevel, MAX_ZOOM))

                currentX = 0
                currentY = 0

                updateZoomDisplay()
                drawCanvas()

                zoomInBtn.disabled = false
                zoomOutBtn.disabled = false
            }
            img.src = event.target.result
        }
        reader.readAsDataURL(file)
    }

    function zoomIn() {
        if (zoomLevel < MAX_ZOOM) {
            zoomLevel += ZOOM_STEP
            zoomLevel = Math.min(zoomLevel, MAX_ZOOM)
            updateZoomDisplay()
            drawCanvas()
        }
    }

    function zoomOut() {
        if (zoomLevel > MIN_ZOOM) {
            zoomLevel -= ZOOM_STEP
            zoomLevel = Math.max(zoomLevel, MIN_ZOOM)
            updateZoomDisplay()
            drawCanvas()
        }
    }

    function updateZoomDisplay() {
        zoomLevelSpan.textContent = `${Math.round(zoomLevel * 100)}%`

        zoomInBtn.disabled = zoomLevel >= MAX_ZOOM
        zoomOutBtn.disabled = zoomLevel <= MIN_ZOOM
    }

    function startDrag(e) {
        if (!userPhoto) return

        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        startX = (e.clientX - rect.left) * scaleX
        startY = (e.clientY - rect.top) * scaleY

        isDragging = true
    }

    function drag(e) {
        if (!isDragging || !userPhoto) return

        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        const mouseX = (e.clientX - rect.left) * scaleX
        const mouseY = (e.clientY - rect.top) * scaleY

        const dx = mouseX - startX
        const dy = mouseY - startY

        currentX += dx
        currentY += dy

        startX = mouseX
        startY = mouseY

        drawCanvas()
    }

    function endDrag() {
        isDragging = false
    }

    function drawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        if (userPhoto) {
            const scaledWidth = userPhoto.width * zoomLevel
            const scaledHeight = userPhoto.height * zoomLevel

            const centerX = canvas.width / 2
            const centerY = canvas.height / 2

            const photoX = centerX - scaledWidth / 2 + currentX
            const photoY = centerY - scaledHeight / 2 + currentY

            ctx.drawImage(userPhoto, photoX, photoY, scaledWidth, scaledHeight)
        }

        ctx.drawImage(overlayImage, 0, 0, canvas.width, canvas.height)

        const name = nameInput.value.trim()
        if (name) {
            ctx.fillStyle = "white"
            ctx.font = "bold 36px Arial"
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"

            const textY = canvas.height * 0.87
            ctx.fillText(name, canvas.width / 2, textY, canvas.width * 0.7)
        }

        downloadBtn.disabled = !userPhoto
    }

    function downloadCard() {
        const name = nameInput.value.trim()
        const sanitizedName = name.replace(/\s+/g, "")
        const fileName = `CCNT_Chapa1_${sanitizedName}.png`

        const link = document.createElement("a")
        link.download = fileName
        link.href = canvas.toDataURL("image/png")
        link.click()
    }

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault()
            document.querySelector(this.getAttribute("href")).scrollIntoView({
                behavior: "smooth",
            })
        })
    })
})
