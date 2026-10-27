package com.nutristep.ai;

import android.Manifest;
import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;
import java.util.List;

/**
 * Exposes Android's hardware step counter (Sensor.TYPE_STEP_COUNTER) to the web app.
 *
 * The step counter runs in the phone's low-power sensor hub and keeps counting while the app is
 * closed; it only reports real walking, so a phone lying on a table or in a moving car does not
 * add steps. The value is "steps since boot"; day accounting happens in counterAccounting.ts.
 *
 * ACTIVITY_RECOGNITION is a runtime permission from API 29. Below that the sensor needs no
 * permission, so the permission call reports "granted" there.
 */
@CapacitorPlugin(
    name = "StepCounter",
    permissions = {
        @Permission(alias = StepCounterPlugin.ACTIVITY, strings = { Manifest.permission.ACTIVITY_RECOGNITION })
    }
)
public class StepCounterPlugin extends Plugin implements SensorEventListener {

    static final String ACTIVITY = "activity";
    private static final long READ_TIMEOUT_MS = 4000;

    private SensorManager sensorManager;
    private Sensor stepSensor;
    private boolean listening = false;
    private boolean wantListening = false;
    private float lastCounter = -1f;
    private final List<PluginCall> pendingReads = new ArrayList<>();
    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override
    public void load() {
        sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        stepSensor = sensorManager == null ? null : sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", stepSensor != null);
        call.resolve(ret);
    }

    @PluginMethod
    public void permission(PluginCall call) {
        if (isGranted()) {
            resolvePermission(call, true);
        } else if (call.getBoolean("request", false)) {
            requestPermissionForAlias(ACTIVITY, call, "permissionCallback");
        } else {
            resolvePermission(call, false);
        }
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        resolvePermission(call, isGranted());
    }

    /** Starts listening; every change is sent to JS as a "counter" event. */
    @PluginMethod
    public void start(PluginCall call) {
        if (stepSensor == null) {
            call.reject("No hardware step counter on this device", "UNAVAILABLE");
            return;
        }
        if (!isGranted()) {
            call.reject("Physical activity permission not granted", "PERMISSION");
            return;
        }
        wantListening = true;
        register();
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        wantListening = false;
        unregister();
        call.resolve();
    }

    /** Resolves with the current counter, waiting briefly for the sensor's first report. */
    @PluginMethod
    public void read(PluginCall call) {
        if (stepSensor == null || !isGranted()) {
            call.reject("Step counter not available", "UNAVAILABLE");
            return;
        }
        if (listening && lastCounter >= 0) {
            call.resolve(counterResult());
            return;
        }
        call.setKeepAlive(true);
        pendingReads.add(call);
        register();
        handler.postDelayed(() -> {
            if (pendingReads.remove(call)) {
                call.setKeepAlive(false);
                call.reject("Step counter did not report in time", "TIMEOUT");
                if (!wantListening) unregister();
            }
        }, READ_TIMEOUT_MS);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() != Sensor.TYPE_STEP_COUNTER) return;
        lastCounter = event.values[0];
        JSObject data = counterResult();
        for (PluginCall call : pendingReads) {
            call.setKeepAlive(false);
            call.resolve(data);
        }
        pendingReads.clear();
        if (wantListening) {
            notifyListeners("counter", data);
        } else {
            unregister();
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    @Override
    protected void handleOnPause() {
        unregister();
        super.handleOnPause();
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        if (wantListening && isGranted()) register();
    }

    private boolean isGranted() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.Q
            || getPermissionState(ACTIVITY) == PermissionState.GRANTED;
    }

    private void register() {
        if (listening || stepSensor == null) return;
        listening = sensorManager.registerListener(this, stepSensor, SensorManager.SENSOR_DELAY_NORMAL);
    }

    private void unregister() {
        if (!listening) return;
        sensorManager.unregisterListener(this);
        listening = false;
        // A fresh registration reports the current value, so the cached one may go stale.
        lastCounter = -1f;
    }

    private JSObject counterResult() {
        JSObject ret = new JSObject();
        ret.put("counter", Math.round(lastCounter));
        return ret;
    }

    private void resolvePermission(PluginCall call, boolean granted) {
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        ret.put("required", Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q);
        call.resolve(ret);
    }
}
