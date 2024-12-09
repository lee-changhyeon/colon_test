import os
import cv2
from datetime import datetime

def crop_moving_region_from_images(folder_path, output_folder):
    # 폴더 내 이미지 파일 목록 가져오기
    image_files = sorted([f for f in os.listdir(folder_path) if f.endswith(('.jpg'))])
    if not image_files:
        print(f"{folder_path}에 jpg 이미지 파일이 없습니다.")
        return

    # 출력 폴더 생성
    os.makedirs(output_folder, exist_ok=True)

    # 첫 번째 이미지를 기준으로 불러오기
    first_image = cv2.imread(os.path.join(folder_path, image_files[0]))
    first_gray = cv2.cvtColor(first_image, cv2.COLOR_BGR2GRAY)
    first_gray = cv2.GaussianBlur(first_gray, (5, 5), 0)

    # 첫 번째 이미지에서 변화된 영역을 찾고 크롭
    max_area = 0
    x, y, w, h = 0, 0, first_image.shape[1], first_image.shape[0]  # 기본적으로 전체 이미지 크기 설정

    for i in range(1, len(image_files)):
        current_image = cv2.imread(os.path.join(folder_path, image_files[i]))
        current_gray = cv2.cvtColor(current_image, cv2.COLOR_BGR2GRAY)
        current_gray = cv2.GaussianBlur(current_gray, (5, 5), 0)

        # 두 이미지 간 차이 계산
        frame_delta = cv2.absdiff(first_gray, current_gray)
        thresh = cv2.threshold(frame_delta, 20, 255, cv2.THRESH_BINARY)[1]
        thresh = cv2.dilate(thresh, None, iterations=2)

        contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # 차이 영역 계산
        for contour in contours:
            area = cv2.contourArea(contour)
            if max_area < area and area > 500:  # 면적이 500 이상일 경우만 처리
                max_area = area
                (x, y, w, h) = cv2.boundingRect(contour)

    # 크롭 영역이 결정된 후, 모든 이미지를 동일한 영역으로 크롭
    for i in range(len(image_files)):
        current_image = cv2.imread(os.path.join(folder_path, image_files[i]))
        cropped_image = current_image[y:y + h, x:x + w]
        output_path = os.path.join(output_folder, image_files[i])
        cv2.imwrite(output_path, cropped_image)

    # 출력 폴더 내 이미지 파일이 없으면 폴더 삭제
    if not any(f.endswith(('.jpg')) for f in os.listdir(output_folder)):
        print(f"{output_folder}에 이미지 파일이 없으므로 폴더를 삭제합니다.")
        shutil.rmtree(output_folder)


def process_folders(start_year, start_month, end_year, end_month, base_folder, output_base_folder):
    start_month = datetime(start_year, start_month, 1)
    end_month = datetime(end_year, end_month, 1)

    if start_month > end_month:
        start_month, end_month = end_month, start_month

    current_month = start_month

    while current_month <= end_month:
        year_str = str(current_month.year)
        month_str = str(current_month.month).zfill(2)
        month_folder = os.path.join(base_folder, year_str, month_str)

        if os.path.exists(month_folder):
            print(f"{month_folder} 폴더가 존재합니다.")
            for date_index, date in enumerate(sorted(os.listdir(month_folder))):
                date_folder = os.path.join(month_folder, date)
                try:
                    for patient_id_index, patient_id in enumerate(os.listdir(date_folder)):
                        patient_id_folder = os.path.join(date_folder, patient_id)
                        output_folder = os.path.join(output_base_folder, year_str, month_str, date, patient_id)

                        crop_moving_region_from_images(patient_id_folder, output_folder)
                        print(f"{year_str}-{month_str}-{date}에서 {patient_id_index + 1}/{len(os.listdir(date_folder))} 완료")
                except Exception as e:
                    print(f"오류 발생: {e}. {date_folder} 스킵.")
                print(f"{year_str}년 {month_str}월에서 {date}일 완료({date_index + 1}/{len(os.listdir(month_folder))})")
        else:
            print(f"{month_folder} 폴더가 존재하지 않습니다.")

        # 다음 월로 이동
        current_month = datetime(
            current_month.year + (current_month.month // 12),
            current_month.month % 12 + 1,
            1
        )

    print("모든 작업이 완료되었습니다!")


# 사용 예시
base_folder = "/data/colon_data"
output_base_folder = "/data/colon_data_crop"
process_folders(2024, 9, 2024, 9, base_folder, output_base_folder)