import os
import cv2
from datetime import datetime
import shutil
from collections import Counter  # Counter 추가

def crop_moving_region_from_images(folder_path, output_folder):
    # 폴더 내 이미지 파일 목록 가져오기
    image_files = sorted([f for f in os.listdir(folder_path) if f.endswith('.jpg')])
    if len(image_files) <= 1:
        print(f"{folder_path}에 유효한 이미지가 부족합니다.")
        return
    # 출력 폴더 생성
    os.makedirs(output_folder, exist_ok=True)

    # 첫 번째 이미지를 제외하고 나머지 이미지들의 크기를 분석
    image_shapes = []
    valid_images = []

    for image_file in image_files:  # 첫 번째 이미지는 제외
        current_image_path = os.path.join(folder_path, image_file)
        current_image = cv2.imread(current_image_path)
        if current_image is None:
            print(f"이미지 로드 실패: {current_image_path}")
            continue

        image_shapes.append(current_image.shape[:2])
        valid_images.append((image_file, current_image))

    # 가장 많이 등장한 크기를 기준으로 필터링
    if not image_shapes:
        print(f"{folder_path}에 유효한 이미지를 찾을 수 없습니다.")
        return

    most_common_shape, count = Counter(image_shapes).most_common(1)[0]
    # print(f"{folder_path}: 가장 빈도가 높은 크기: {most_common_shape} (빈도: {count})")

    selected_images = [(file, img) for file, img in valid_images if img.shape[:2] == most_common_shape]

    crop_selected_images = []
    if len(selected_images) < 11 :
        crop_selected_images = selected_images
    else :
        crop_selected_images = selected_images[1:11]
    gray_images = [cv2.GaussianBlur(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), (5, 5), 0) for _, img in crop_selected_images]

    # 차이 계산
    deltas = [
        cv2.absdiff(gray_images[i], gray_images[i + 1])
        for i in range(len(gray_images) - 1)
    ]

    # 차이 이진화 및 팽창
    threshs = [
        cv2.dilate(cv2.threshold(delta, 20, 255, cv2.THRESH_BINARY)[1], None, iterations=2)
        for delta in deltas
    ]

    # 모든 컨투어에서 최대 영역을 탐색
    max_area = 0
    x, y, w, h = 0, 0, most_common_shape[1], most_common_shape[0]  # 기본적으로 전체 크기를 포함

    for thresh in threshs:
        contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 500 and area > max_area:  # 최소 면적 500 이상
                max_area = area
                x, y, w, h = cv2.boundingRect(contour)

    # 크기가 같은 이미지들만 크롭 수행
    for file, img in selected_images:
        cropped_image = img[y:y + h, x:x + w]
        output_path = os.path.join(output_folder, file)
        cv2.imwrite(output_path, cropped_image)

    # 출력 폴더 내 이미지 파일이 없으면 폴더 삭제
    if not any(f.endswith('.jpg') for f in os.listdir(output_folder)):
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
                        print(patient_id, end='\t')
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
# base_folder = "/data/test"
# output_base_folder = "/data/test_crop"
process_folders(2022, 1, 2022, 12, base_folder, output_base_folder)