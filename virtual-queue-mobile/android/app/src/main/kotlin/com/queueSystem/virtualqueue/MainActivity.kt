package com.queueSystem.virtualqueue

import android.app.Activity
import android.app.RemoteInput
import android.content.Intent
import androidx.wear.input.RemoteInputIntentHelper
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    companion object {
        private const val CHANNEL = "virtual_queue/wear_input"
        private const val REMOTE_INPUT_KEY = "wear_text"
        private const val REMOTE_INPUT_REQUEST = 7101
    }

    private var pendingInputResult: MethodChannel.Result? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            CHANNEL,
        ).setMethodCallHandler { call, result ->
            if (call.method != "requestText") {
                result.notImplemented()
                return@setMethodCallHandler
            }

            if (pendingInputResult != null) {
                result.error("INPUT_IN_PROGRESS", "Another text input is open", null)
                return@setMethodCallHandler
            }

            val label = call.argument<String>("label") ?: "Escribe el texto"
            val remoteInput = RemoteInput.Builder(REMOTE_INPUT_KEY)
                .setLabel(label)
                .setAllowFreeFormInput(true)
                .build()
            val intent = RemoteInputIntentHelper.createActionRemoteInputIntent()

            RemoteInputIntentHelper.putRemoteInputsExtra(
                intent,
                listOf(remoteInput),
            )
            RemoteInputIntentHelper.putTitleExtra(intent, label)
            RemoteInputIntentHelper.putConfirmLabelExtra(intent, "Aceptar")
            RemoteInputIntentHelper.putCancelLabelExtra(intent, "Cancelar")

            pendingInputResult = result
            startActivityForResult(intent, REMOTE_INPUT_REQUEST)
        }
    }

    @Deprecated("Deprecated in Android SDK, required by the Wear RemoteInput API")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode != REMOTE_INPUT_REQUEST) {
            super.onActivityResult(requestCode, resultCode, data)
            return
        }

        val result = pendingInputResult ?: return
        pendingInputResult = null

        if (resultCode != Activity.RESULT_OK || data == null) {
            result.success(null)
            return
        }

        val text = RemoteInput.getResultsFromIntent(data)
            ?.getCharSequence(REMOTE_INPUT_KEY)
            ?.toString()
        result.success(text)
    }
}