// Libraries
#include <WiFi.h>
#include <WiFiClient.h>
#include <SPI.h>     //https://www.arduino.cc/en/reference/SPI
#include <Arduino.h> //Maybe remove
#include <stdint.h>  // Maybe remove
#include <MFRC522.h> //https://github.com/OSSLibraries/Arduino_MFRC522v2
#include <PubSubClient.h>
#include <WiFiUdp.h>
#include <NTPClient.h>
#include <ArduinoJson.h>
// Time Libraries
#include <iostream>
#include <chrono>
#include <thread>

// RDIF
//  Constants
#define SS_PIN 5
#define RST_PIN 0
// Parameters
const int ipaddress[4] = {103, 97, 67, 25};
// Variables
byte nuidPICC[4] = {0, 0, 0, 0};
MFRC522::MIFARE_Key key;
MFRC522 rfid = MFRC522(SS_PIN, RST_PIN);

// Network
const char *ssid = "T14One";
const char *password = "12349876";

// NTP client settings
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP);

// JSON buffer size
const size_t bufferSize = JSON_OBJECT_SIZE(12);

// MQTT Broker
// const char *mqtt_broker = "192.168.52.129";
const char *mqtt_broker = "192.168.138.91";
const char *topic = "esp32/ahash";
const char *mqtt_username = "ahash";
const char *mqtt_password = "ahash";
const int mqtt_port = 1885;

// Auxiliar variables to store the current output state
String redLED_State = "off";
String blueLED_State = "off";
String whiteLED_State = "off";
String greenLED_State = "off";

// Assign output variables to GPIO pins
const int redLED = 25;   // RedLED
const int blueLED = 26;  // BlueLED
const int whiteLED = 32; // WhiteLED
const int greenLED = 33; // GreenLED

// Current time
unsigned long currentTime = millis();
// Previous time
unsigned long previousTime = 0;
// Define timeout time in milliseconds (example: 2000ms = 2s)
const long timeoutTime = 2000;

WiFiClient espClient;
PubSubClient client(espClient);

// Ultrasonic Sensor
const int trigPin = 14;
const int echoPin = 12;

// define sound speed in cm/uS
#define SOUND_SPEED 0.034
#define CM_TO_INCH 0.393701

long duration;
float distanceCm;
float distanceInch;

void setLED(int pin, String &state, bool desiredState)
{
  if (desiredState)
  {
    digitalWrite(pin, HIGH);
    state = "on";
  }
  else
  {
    digitalWrite(pin, LOW);
    state = "off";
  }
}

void setup()
{
  Serial.begin(115200);
  // Initialize the output variables as outputs
  pinMode(redLED, OUTPUT);
  pinMode(blueLED, OUTPUT);
  pinMode(whiteLED, OUTPUT);
  pinMode(greenLED, OUTPUT);
  // Initialize LED states
  setLED(redLED, redLED_State, true);
  setLED(blueLED, blueLED_State, false);
  setLED(whiteLED, whiteLED_State, false);
  setLED(greenLED, greenLED_State, false);
  // Ultrasonic Sensor
  pinMode(trigPin, OUTPUT); // Sets the trigPin as an Output
  pinMode(echoPin, INPUT);  // Sets the echoPin as an Input

  // connecting to a WiFi network
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.println("Connecting to WiFi..");
  }
  Serial.println("Connected to the WiFi network");
  
  // connecting to a mqtt broker
  client.setServer(mqtt_broker, mqtt_port);
  client.setCallback(callback);
  while (!client.connected())
  {
    String client_id = "esp32-client-";
    client_id += String(WiFi.macAddress());
    Serial.printf("The client %s connects to the public mqtt broker\n", client_id.c_str());
    if (client.connect(client_id.c_str(), mqtt_username, mqtt_password))
    {
      Serial.println("Public emqx mqtt broker connected");
    }
    else
    {
      Serial.print("failed with state ");
      Serial.print(client.state());
      delay(2000);
    }
  }
  // publish and subscribe
  client.publish(topic, "VirkPlz");
  client.subscribe(topic);
  
  Serial.println(F("Initialize System"));
  // init rfid D8,D5,D6,D7
  SPI.begin();
  rfid.PCD_Init();
  Serial.print(F("Reader :"));
  rfid.PCD_DumpVersionToSerial();

  // Initialize NTP client
  timeClient.begin();
}

void callback(char *topic, byte *payload, unsigned int length)
{
  String payloadStr = "";
  Serial.print("Message arrived in topic: ");
  Serial.println(topic);
  Serial.print("Message: ");
  for (int i = 0; i < length; i++)
  {
    Serial.print((char)payload[i]);
    payloadStr += (char)payload[i];
  }
  Serial.println();
  Serial.println("-----------------------");

  if (payloadStr == "unlock")
  {
    setLED(redLED, redLED_State, false);
    setLED(greenLED, greenLED_State, true);
  }
  else if (payloadStr == "lock")
  {
    setLED(greenLED, greenLED_State, false);
    setLED(redLED, redLED_State, true);
  }
}

float ultrasonicSensor()
{
  // Clears the trigPin
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  // Sets the trigPin on HIGH state for 10 micro seconds
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Reads the echoPin, returns the sound wave travel time in microseconds
  duration = pulseIn(echoPin, HIGH);

  // Calculate the distance
  distanceCm = duration * SOUND_SPEED / 2;

  // Convert to inches
  // distanceInch = distanceCm * CM_TO_INCH;

  // Prints the distance in the Serial Monitor
  Serial.print("Distance (cm): ");
  Serial.println(distanceCm);

  // Serial.print("Distance (inch): ");
  // Serial.println(distanceInch);

  delay(1000);
  return distanceCm;
}

void readRFID(void)
{ /* function readRFID */
  ////Read RFID card
  for (byte i = 0; i < 6; i++)
  {
    key.keyByte[i] = 0xFF;
  }
  // Look for new 1 cards
  if (!rfid.PICC_IsNewCardPresent())
    return;
  // Verify if the NUID has been read
  if (!rfid.PICC_ReadCardSerial())
    return;
  // Store NUID into nuidPICC array
  for (byte i = 0; i < 4; i++)
  {
    nuidPICC[i] = rfid.uid.uidByte[i];
  }
  Serial.print(F("RFID In dec: "));
  printDec(rfid.uid.uidByte, rfid.uid.size);

  // Blue light
  setLED(blueLED, blueLED_State, true);
  setLED(redLED, redLED_State, false);
  setLED(greenLED, greenLED_State, true);
  auto start_time = std::chrono::system_clock::now();
  while (std::chrono::duration_cast<std::chrono::seconds>(std::chrono::system_clock::now() - start_time).count() < 10)
  {
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
  }
  setLED(blueLED, blueLED_State, false);
  setLED(redLED, redLED_State, true);
  setLED(greenLED, greenLED_State, false);
  Serial.println();
  // Halt PICC
  rfid.PICC_HaltA();
  // Stop encryption on PCD
  rfid.PCD_StopCrypto1();
}
/**
    Helper routine to dump a byte array as hex values to Serial.
*/
void printHex(byte *buffer, byte bufferSize)
{
  for (byte i = 0; i < bufferSize; i++)
  {
    Serial.print(buffer[i] < 0x10 ? " 0" : " ");
    Serial.print(buffer[i], HEX);
  }
}
/**
    Helper routine to dump a byte array as dec values to Serial.
*/
void printDec(byte *buffer, byte bufferSize)
{
  for (byte i = 0; i < bufferSize; i++)
  {
    Serial.print(buffer[i] < 0x10 ? " 0" : " ");
    Serial.print(buffer[i], DEC);
  }
}

void heartbeat()
{
  // Create JSON document
  StaticJsonDocument<bufferSize> jsonDoc;
  JsonObject json = jsonDoc.to<JsonObject>();

  // Get system information
  json["Id"] = ESP.getEfuseMac();
  json["cpuFreq"] = ESP.getCpuFreqMHz();
  json["freeMem"] = ESP.getFreeHeap();
  json["heapSize"] = ESP.getHeapSize();

  // Get current time
  timeClient.update();
  json["time"] = timeClient.getFormattedTime();

  // Get Wi-Fi status
  json["ssid"] = WiFi.SSID();
  json["signalStrength"] = WiFi.RSSI();
  json["ipAddress"] = WiFi.localIP().toString();

  // States
  jsonObject["red_led_state"] = redLED_State;
  jsonObject["blue_led_state"] = blueLED_State;
  jsonObject["white_led_state"] = whiteLED_State;
  jsonObject["green_led_state"] = greenLED_State;

  // Serialize JSON document to string
  String jsonString;
  serializeJson(jsonDoc, jsonString);

  // Send heartbeat message to server
  publishMessageMQTT("/ESP32/Heartbeat", jsonString);
}

void publishMessageMQTT(char topicToSentTo, String message)
{
  String str = message;

  // Length (with one extra character for the null terminator)
  int str_len = str.length() + 1;

  // Prepare the character array (the buffer)
  char char_array[str_len];

  // Copy it over
  str.toCharArray(char_array, str_len);

  client.publish(topicToSentTo, char_array);
}

void tempPrint()
{
  // Get system information
  Serial.print("ESP32 ID: ");
  uint64_t chipId = ESP.getEfuseMac();
  Serial.printf("%04X%08X\n", (uint16_t)(chipId >> 32), (uint32_t)chipId);
  Serial.print("CPU frequency: ");
  Serial.println(ESP.getCpuFreqMHz());
  Serial.print("Free memory: ");
  Serial.println(ESP.getFreeHeap());
  Serial.print("Available heap size: ");
  Serial.println(ESP.getHeapSize());

  // Get current time
  timeClient.update();
  Serial.print("Current time: ");
  Serial.println(timeClient.getFormattedTime());

  // Get Wi-Fi status
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());
  Serial.print("Signal strength: ");
  Serial.println(WiFi.RSSI());
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void loop()
{
  static unsigned long lastHeartbeatTime = 0;
  if (millis() - lastHeartbeatTime >= 60000)
  {
    lastHeartbeatTime = millis();
    heartbeat();
    tempPrint();
  }

  readRFID();

  int doorOpenDistance = ultrasonicSensor();

  if (doorOpenDistance > 20)
  {
    setLED(redLED, redLED_State, false);
    setLED(greenLED, greenLED_State, true);
    setLED(whiteLED, whiteLED_State, true);
  }
  else
  {
    setLED(greenLED, greenLED_State, false);
    setLED(whiteLED, whiteLED_State, false);
    setLED(redLED, redLED_State, true);
  }

  client.loop();
}
