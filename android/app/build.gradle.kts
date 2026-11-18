plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Live reload na TV: ./gradlew installDebug -PdevServer=http://<ip-do-mac>:5173
val devServer = (project.findProperty("devServer") as String?).orEmpty()

android {
    namespace = "com.goular.launcher"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.goular.launcher"
        minSdk = 25 // Fire OS 6 (Android 7.1)
        targetSdk = 30 // Fire OS 8 (Android 11)
        versionCode = 1
        versionName = "0.1.0"
    }

    buildTypes {
        debug {
            buildConfigField("String", "DEV_SERVER_URL", "\"$devServer\"")
        }
        release {
            isMinifyEnabled = false
            buildConfigField("String", "DEV_SERVER_URL", "\"\"")
            // Uso pessoal: assina com a chave de debug. Troque por uma keystore própria se for distribuir.
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    buildFeatures { buildConfig = true }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.webkit:webkit:1.12.1")
}

// Falha cedo e com mensagem clara se a UI web não foi gerada.
val checkWebAssets by tasks.registering {
    val index = file("src/main/assets/www/index.html")
    doLast {
        if (devServer.isEmpty() && !index.exists()) {
            throw GradleException("UI web não encontrada. Rode antes: (cd web && npm run build)")
        }
    }
}
tasks.named("preBuild") { dependsOn(checkWebAssets) }
