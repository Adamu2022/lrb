import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config } from 'dotenv';

async function bootstrap() {
  // Load environment variables
  config();
  
  const app = await NestFactory.create(AppModule);
  
  // Configure CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe());
  
  // Set global prefix
  app.setGlobalPrefix('api');
  
  // Configure Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Lecture Reminder System API')
    .setDescription('API documentation for the Lecture Reminder System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);
  
  await app.listen(3001);
}
bootstrap();