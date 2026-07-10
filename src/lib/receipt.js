import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

// 將一個 DOM 元素 render 成 PDF 落載。
// 用瀏覽器自己嘅字型 rasterize，所以繁體中文喺邊部機都一定顯示到，
// 唔使喺後端裝 CJK 字型。
export async function downloadReceiptPdf(element, filename = 'receipt.pdf') {
  if (!element) return
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  })
  // 白底收據用 JPEG，檔案細好多（PNG 會成 MB 計）
  const imgData = canvas.toDataURL('image/jpeg', 0.95)
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const margin = 36
  const imgW = pageW - margin * 2
  const imgH = (canvas.height / canvas.width) * imgW
  pdf.addImage(imgData, 'JPEG', margin, margin, imgW, imgH)
  pdf.save(filename)
}
