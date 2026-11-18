<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Attachment;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'attachable_type' => 'required|string',
            'attachable_id' => 'required|integer',
        ]);

        $file = $request->file('file');
        $path = $file->store('attachments', 'private');

        $attachment = Attachment::create([
            'user_id' => auth()->id(),
            'attachable_type' => $request->attachable_type,
            'attachable_id' => $request->attachable_id,
            'filename' => basename($path),
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'path' => $path,
        ]);

        return response()->json($attachment, 201);
    }

    public function download(Attachment $attachment)
    {
        if ($attachment->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return Storage::disk('private')->download($attachment->path, $attachment->original_filename);
    }

    public function destroy(Attachment $attachment)
    {
        if ($attachment->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        Storage::disk('private')->delete($attachment->path);
        $attachment->delete();

        return response()->json(['message' => 'Attachment deleted']);
    }
}