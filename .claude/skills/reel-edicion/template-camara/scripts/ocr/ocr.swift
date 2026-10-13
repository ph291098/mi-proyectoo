import Foundation
import Vision
import AppKit
// uso: ocr <salida.jsonl> <jpg>...   → una linea JSON por imagen: {"f":nombre,"t":[[texto,x,y,w,h],...]} (px, origen arriba-izq)
let args = CommandLine.arguments
let out = FileHandle(forWritingAtPath: args[1]) ?? { FileManager.default.createFile(atPath: args[1], contents: nil); return FileHandle(forWritingAtPath: args[1])! }()
out.seekToEndOfFile()
for p in args.dropFirst(2) {
  autoreleasepool {
    guard let img = NSImage(contentsOfFile: p), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { return }
    let W = Double(cg.width), H = Double(cg.height)
    let req = VNRecognizeTextRequest()
    req.recognitionLevel = .accurate
    req.usesLanguageCorrection = false
    try? VNImageRequestHandler(cgImage: cg).perform([req])
    var rows: [[Any]] = []
    for o in req.results ?? [] {
      guard let c = o.topCandidates(1).first else { continue }
      let b = o.boundingBox
      rows.append([c.string, Int(b.minX*W), Int((1-b.maxY)*H), Int(b.width*W), Int(b.height*H)])
    }
    let d = try! JSONSerialization.data(withJSONObject: ["f": (p as NSString).lastPathComponent, "t": rows])
    out.write(d); out.write("\n".data(using: .utf8)!)
  }
}
