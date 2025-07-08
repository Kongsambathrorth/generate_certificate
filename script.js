// Ensure all resources are loaded before running JavaScript that depends on them
window.onload = function() {
    // Get references to input fields
    const recipientNameInput = document.getElementById('recipientName');
    const conductedOnInput = document.getElementById('conductedOn');
    const certificateIdInput = document.getElementById('certificateId');
    const qrCodeLinkInput = document.getElementById('qrCodeLink');
    const generateButton = document.getElementById('generateCertificateBtn');
    const downloadButton = document.getElementById('downloadCertificateBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn'); // New PDF download button

    // Get references to display elements on the certificate
    const displayRecipientName = document.getElementById('displayRecipientName');
    const displayConductedOn = document.getElementById('displayConductedOn');
    const displayCertificateId = document.getElementById('displayCertificateId');
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const certificateToDownload = document.getElementById('certificateToDownload');

    // Function to format date for display
    function formatDateForDisplay(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', options).toUpperCase();
    }

    // Function to generate a simple UUID for default certificate ID
    function generateUUID() {
        return 'CERT-' + 'xxxx-xxxx-xxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }).toUpperCase();
    }

    // Function to update the QR code using the external API
    function updateQrCode(link) {
        // Clear previous QR code if exists
        qrCodeContainer.innerHTML = '';

        const qrData = link.trim() === '' ? "No Link Provided" : link;
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}`;

        const qrImage = document.createElement('img');
        qrImage.src = qrApiUrl;
        qrImage.alt = "QR Code for Verification";
        qrImage.className = "rounded-md"; // Apply some styling
        qrImage.onerror = () => {
            console.error("Failed to load QR code image from API.");
            qrCodeContainer.innerHTML = '<p class="text-red-500 text-xs">Failed to load QR code.</p>';
        };
        qrCodeContainer.appendChild(qrImage);
    }

    // Set initial default values
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const defaultDate = `${year}-${month}-${day}`;

    conductedOnInput.value = defaultDate;
    displayConductedOn.textContent = formatDateForDisplay(defaultDate);

    certificateIdInput.value = generateUUID(); // Set initial UUID
    displayCertificateId.textContent = certificateIdInput.value;

    // Function to update all certificate details
    function updateCertificate() {
        // Update recipient name
        displayRecipientName.textContent = recipientNameInput.value.trim() === '' ? 'JOHN DOE' : recipientNameInput.value.toUpperCase();

        // Update conducted on date
        const newConductedOn = conductedOnInput.value;
        if (newConductedOn) {
            displayConductedOn.textContent = formatDateForDisplay(newConductedOn);
        } else {
            displayConductedOn.textContent = formatDateForDisplay(defaultDate); // Fallback to default if cleared
        }

        // Update certificate ID
        displayCertificateId.textContent = certificateIdInput.value.trim() === '' ? generateUUID() : certificateIdInput.value.toUpperCase();

        // Update QR code directly from the input field
        updateQrCode(qrCodeLinkInput.value);
    }

    // Event listener for the generate button
    generateButton.addEventListener('click', updateCertificate);

    // Event listener for the download as Image button
    downloadButton.addEventListener('click', () => {
        const formContainer = document.querySelector('.input-form-container');
        formContainer.style.display = 'none'; // Hide form during capture

        html2canvas(certificateToDownload, {
            scale: 3.125, // Adjusted scale for 300 PPI output
            useCORS: true,
            logging: false
        }).then(canvas => {
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `certificate_${recipientNameInput.value.replace(/\s/g, '_') || 'John_Doe'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            formContainer.style.display = 'block'; // Show form again
        }).catch(error => {
            console.error('Error generating certificate image:', error);
            formContainer.style.display = 'block'; // Show form even on error
        });
    });

    // Event listener for the download as PDF button
    downloadPdfBtn.addEventListener('click', () => {
        const formContainer = document.querySelector('.input-form-container');
        formContainer.style.display = 'none'; // Hide form during capture

        html2canvas(certificateToDownload, {
            scale: 3.125, // Adjusted scale for 300 PPI output
            useCORS: true,
            logging: false
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;

            // A4 dimensions in mm (portrait: 210mm x 297mm)
            const pdfWidthMm = 210;
            const pdfHeightMm = 297;

            // Create PDF in portrait A4 format
            const pdf = new jsPDF('portrait', 'mm', 'a4');

            // Get image dimensions from the canvas (in pixels)
            const imgWidthPx = canvas.width;
            const imgHeightPx = canvas.height;
            const imgAspectRatio = imgWidthPx / imgHeightPx;

            let finalImgWidthMm;
            let finalImgHeightMm;

            // Desired top/bottom margin in mm (approx 1 inch each side)
            const desiredVerticalMarginMm = 25.4; // 1 inch
            const sideMarginMm = 25.4; // 1 inch

            const effectivePrintableWidthMm = pdfWidthMm - (2 * sideMarginMm);
            const effectivePrintableHeightMm = pdfHeightMm - (2 * desiredVerticalMarginMm);

            const printableAspectRatio = effectivePrintableWidthMm / effectivePrintableHeightMm;

            // Calculate scale factors to fit the image completely within the printable area
            // This is a "contain" behavior, maximizing size without cropping.
            if (imgAspectRatio > printableAspectRatio) {
                // Image is wider relative to its height than the printable area, fit by width
                finalImgWidthMm = effectivePrintableWidthMm;
                finalImgHeightMm = effectivePrintableWidthMm / imgAspectRatio;
            } else {
                // Image is taller relative to its width than the printable area, fit by height
                finalImgHeightMm = effectivePrintableHeightMm;
                finalImgWidthMm = effectivePrintableHeightMm * imgAspectRatio;
            }

            // Calculate position to center the image on the page
            const offsetX = sideMarginMm + (effectivePrintableWidthMm - finalImgWidthMm) / 2;
            const offsetY = desiredVerticalMarginMm + (effectivePrintableHeightMm - finalImgHeightMm) / 2;

            pdf.addImage(imgData, 'PNG', offsetX, offsetY, finalImgWidthMm, finalImgHeightMm);
            pdf.save(`certificate_${recipientNameInput.value.replace(/\s/g, '_') || 'John_Doe'}.pdf`);

            formContainer.style.display = 'block'; // Show form again
        }).catch(error => {
            console.error('Error generating certificate PDF:', error);
            formContainer.style.display = 'block'; // Show form even on error
        });
    });

    // Initial update on page load
    updateCertificate();
}; // End of window.onload