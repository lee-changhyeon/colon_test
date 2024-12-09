import os
import shutil
import pandas as pd
from datetime import datetime
import asyncio

# Excel 데이터 읽기 함수
def input_excel(excel_file):
    excel_data = pd.read_excel(excel_file)
    
    # 날짜 변환
    excel_data['date'] = pd.to_datetime(excel_data['날짜'], format='%m/%d/%Y %H:%M:%S').dt.strftime('%Y-%m-%d')
    
    # 텍스트 데이터 처리
    for key in ['판독내용', 'GROSS', 'MICRO', 'DIAGNOSIS', 'NOTE']:
        if key in excel_data.columns:
            excel_data[key] = excel_data[key].fillna("").str.replace(r'\r\r\n', '\r\n', regex=True)
    return excel_data.to_dict('records')

# 폴더 복사 함수 (파일 단위 복사)
def copy_folder(src, dest):
    try:
        if not os.path.exists(src):
            print(f"Source folder does not exist: {src}")
            return

        os.makedirs(dest, exist_ok=True)

        # I/O 캐시 활용: 폴더 내 엔트리 미리 로드
        folder_entries = list(os.scandir(src))
        if not folder_entries:  # 비어 있는 폴더 스킵
            print(f"Skipping empty folder: {src}")
            return
        
        for entry in folder_entries:
            src_path = os.path.join(src, entry.name)
            dest_path = os.path.join(dest, entry.name)

            if entry.is_dir():
                copy_folder(src_path, dest_path)
            else:
                shutil.copy(src_path, dest_path)  # 메타데이터 복사 필요 없으면 shutil.copy 사용
    except Exception as e:
        print(f"Failed to copy folder: {src} -> {dest}, Error: {str(e)}")

# 지연 함수
async def delay(ms):
    await asyncio.sleep(ms / 1000)

# 배치로 파일 복사 처리
async def copy_image_batch(excel_file_name, copy_folder_path, src_folder_path, batch_size=5, delay_ms=2000, max_concurrent_tasks=3):
    excel_data = input_excel(excel_file_name)
    semaphore = asyncio.Semaphore(max_concurrent_tasks)  # 동시 작업 제한

    async def process_folder(src_path, dest_path):
        async with semaphore:
            try:
                if os.path.exists(src_path):
                    # 비어 있는 폴더 처리
                    folder_entries = list(os.scandir(src_path))
                    if not folder_entries:
                        print(f"Skipping empty folder: {src_path}")
                        return

                    print(f"Copying: {src_path} -> {dest_path}")
                    copy_folder(src_path, dest_path)
                else:
                    print(f"Source folder not found: {src_path}")
            except Exception as e:
                print(f"Error accessing or copying folder: {src_path}, Error: {str(e)}")

    # 배치 처리
    for i in range(0, len(excel_data), batch_size):
        batch = excel_data[i:i + batch_size]
        tasks = []
        for excel in batch:
            string_patient_id = str(excel['차트번호']).zfill(7)
            year, month, day = excel['date'].split('-')

            src_path = os.path.join(src_folder_path, year, month, day, string_patient_id)
            dest_path = os.path.join(copy_folder_path, year, month, day, string_patient_id)

            tasks.append(process_folder(src_path, dest_path))

        # 현재 배치 작업 수행
        await asyncio.gather(*tasks)

        # 배치 완료 후 지연
        print(f"Batch {i // batch_size + 1} completed. Waiting...")
        await delay(delay_ms)

# 실행
if __name__ == "__main__":
    excel_file_name = '[2024-2020][with_img][merge][rm_EGD]_판독+조직검사_결과.xlsx'
    copy_folder_path = '/data_hard/colon_crop_with_result'
    src_folder_path = '/data_hard/colon_crop'

    asyncio.run(copy_image_batch(excel_file_name, copy_folder_path, src_folder_path, batch_size=2, delay_ms=2000, max_concurrent_tasks=3))
    print("Copy operation completed")